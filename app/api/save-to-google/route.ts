import { NextResponse } from "next/server";
import { google } from "googleapis";

function getAuth() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "";
  const keyJson = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));
  
  return new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export async function POST(req: Request) {
  try {
    const {
      content,
      courseName,
      contentType,
      target,
      mainKeyword,
      subKeywords,
      topicTitle,
      folderId,
    } = await req.json();

    if (!content || !topicTitle) {
      return NextResponse.json({ error: "콘텐츠 또는 주제가 비어 있습니다." }, { status: 400 });
    }

    const auth = getAuth();
    const docs = google.docs({ version: "v1", auth });
    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    // --- 1. Google Docs에 문서 생성 ---
    const docTitle = `[SEO] ${topicTitle} - ${new Date().toLocaleDateString("ko-KR")}`;
    
    const createRes = await docs.documents.create({
      requestBody: { title: docTitle },
    });

    const docId = createRes.data.documentId!;
    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    // 본문 삽입
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      },
    });

    // 폴더로 이동 (지정된 경우)
    if (folderId) {
      try {
        const file = await drive.files.get({
          fileId: docId,
          fields: "parents",
        });
        const previousParents = (file.data.parents || []).join(",");
        await drive.files.update({
          fileId: docId,
          addParents: folderId,
          removeParents: previousParents,
          fields: "id, parents",
        });
      } catch (moveErr) {
        console.error("Failed to move doc to folder:", moveErr);
      }
    }

    // 문서를 누구나 링크로 열람 가능하게 설정
    try {
      await drive.permissions.create({
        fileId: docId,
        requestBody: {
          role: "writer",
          type: "anyone",
        },
      });
    } catch (permErr) {
      console.error("Failed to set permissions:", permErr);
    }

    // --- 2. Google Sheets에 아카이빙 ---
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID || "1tncsdYpAxSQpxMgShm2VnyIp9gtjJrZboJzbZcNpElI";
    const today = new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const row = [
      today,
      courseName || "",
      contentType || "",
      target || "",
      mainKeyword || "",
      (subKeywords || []).join(", "),
      topicTitle || "",
      docUrl,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "시트1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    return NextResponse.json({ docUrl, docId, message: "저장 완료!" });
  } catch (error: any) {
    console.error("Save to Google Error:", error);
    const msg = error?.message || "알 수 없는 오류";
    return NextResponse.json({ error: `Google 저장 실패: ${msg}` }, { status: 500 });
  }
}
