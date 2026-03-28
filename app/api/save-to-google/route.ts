import { NextResponse } from "next/server";
import { google } from "googleapis";

function getAuthInfo() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "";
  const keyJson = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));
  
  const auth = new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  return { auth, keyJson };
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

    const { auth, keyJson } = getAuthInfo();
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
    
    // 시트 이름 동적 확인 (시트1 또는 Sheet1 등 대응)
    let targetRange = "A:H";
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
      const firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title;
      if (firstSheetName) {
        targetRange = `${firstSheetName}!A:H`;
      }
    } catch (sheetErr: any) {
      console.error("Failed to fetch spreadsheet info:", sheetErr);
      // 만약 여기서 403이 난다면 시트 자체에 접근 권한이 없는 것
      if (sheetErr.status === 403) {
        throw new Error(`시트 접근 권한이 없습니다. (ID: ${SHEET_ID}). 서비스 계정 이메일(${keyJson.client_email})이 해당 시트에 '편집자'로 추가되어 있는지 확인해주세요.`);
      }
    }

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
      range: targetRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    return NextResponse.json({ docUrl, docId, message: "저장 완료!" });
  } catch (error: any) {
    console.error("Save to Google Error Detailed:", error);
    
    // 상세 에러 메시지 구성
    let errorMsg = error?.message || "알 수 없는 오류";
    if (error?.response?.data?.error?.message) {
      errorMsg = error.response.data.error.message;
    }
    
    return NextResponse.json({ error: `Google 저장 실패: ${errorMsg}` }, { status: 500 });
  }
}
