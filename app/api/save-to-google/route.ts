import { NextResponse } from "next/server";
import { google } from "googleapis";

function getAuthInfo() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "";
  if (!keyBase64) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY가 환경 변수에 설정되지 않았습니다.");
  
  const keyJson = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));
  
  const auth = new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file"
    ],
  });

  return { auth, keyJson };
}

export async function POST(req: Request) {
  let currentStep = "인증 준비";
  let clientEmail = "알 수 없음";

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

    const { auth, keyJson } = getAuthInfo();
    clientEmail = keyJson.client_email;
    
    const docs = google.docs({ version: "v1", auth });
    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    // --- 1. Google Drive API를 사용하여 문서 파일 생성을 먼저 시도 (403 우회용) ---
    currentStep = "Step 1: Google Drive API로 문서 생성";
    console.log(currentStep);
    
    const docTitle = `[SEO] ${topicTitle} - ${new Date().toLocaleDateString("ko-KR")}`;
    
    // docs.create 대신 drive.files.create를 사용
    const driveRes = await drive.files.create({
      requestBody: {
        name: docTitle,
        mimeType: "application/vnd.google-apps.document",
        parents: folderId ? [folderId] : []
      },
      fields: "id"
    });

    const docId = driveRes.data.id!;
    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    // --- 2. Docs API를 사용하여 본문 내용 삽입 ---
    currentStep = "Step 2: 생성된 문서에 본문 내용 삽입";
    console.log(currentStep);
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

    // --- 3. 문서 권한 설정 (누구나 읽기 가능) ---
    currentStep = "Step 3: 문서 공유 권한 설정";
    try {
      await drive.permissions.create({
        fileId: docId,
        requestBody: { role: "reader", type: "anyone" },
      });
    } catch (e) {
      console.warn("권한 설정 실패(비필수):", e);
    }

    // --- 4. Google Sheets에 아카이빙 ---
    currentStep = "Step 4: Google Sheets 정보 확인 및 기록";
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID || "1_uT4vIH9wsagpfiSepHKWAQ_h_J0cZG8z956R2ibWRs";
    
    let targetRange = "A:H";
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
      const firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title;
      if (firstSheetName) {
        targetRange = `${firstSheetName}!A:H`;
      }
    } catch (sheetErr: any) {
      console.error("Sheet info fetch failed:", sheetErr);
    }

    const today = new Date().toLocaleDateString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
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
      requestBody: { values: [row] },
    });

    return NextResponse.json({ docUrl, docId, message: "구글 저장 성공!" });
  } catch (error: any) {
    console.error(`Error at ${currentStep}:`, error);
    
    let detail = error?.message || "알 수 없는 오류";
    if (error?.response?.data?.error?.message) {
      detail = error.response.data.error.message;
    }

    return NextResponse.json({ 
      error: `[위치]: ${currentStep}\n[사유]: ${detail}\n[연결 계정]: ${clientEmail}\n\n* 모든 API가 켜져 있는데도 이 에러가 지속된다면 'OAuth 2.0 클라이언트' 방식으로 전환이 필요할 수 있습니다.` 
    }, { status: 500 });
  }
}
