import { NextResponse } from "next/server";
import { google } from "googleapis";

/**
 * OAuth 2.0 인증 정보를 사용하여 Google Auth 객체 생성
 */
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

export async function POST(req: Request) {
  let currentStep = "OAuth 2.0 인증 준비";

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

    const auth = getOAuth2Client();
    const docs = google.docs({ version: "v1", auth });
    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    // --- 1. Google Drive API를 사용하여 본인 계정에 문서 생성 ---
    currentStep = "Step 1: 본인 계정 드라이브에 문서 생성";
    console.log(currentStep);
    
    const docTitle = `[SEO] ${topicTitle} - ${new Date().toLocaleDateString("ko-KR")}`;
    
    // mimeType을 문서로 지정하여 생성
    const driveRes = await drive.files.create({
      requestBody: {
        name: docTitle,
        mimeType: "application/vnd.google-apps.document",
        parents: folderId ? [folderId] : [] // 특정 폴더 지정 시 해당 폴더에 생성
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

    // --- 3. Google Sheets에 아카이빙 ---
    currentStep = "Step 3: Google Sheets 기록";
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID || "1_uT4vIH9wsagpfiSepHKWAQ_h_J0cZG8z956R2ibWRs";
    
    // 시트 이름 자동 감지 (첫 번째 탭 사용)
    let targetRange = "A:H";
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
      const firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title;
      if (firstSheetName) {
        targetRange = `${firstSheetName}!A:H`;
      }
    } catch (sheetErr: any) {
      console.error("Sheet 감지 실패:", sheetErr);
      // 권한 오류가 나면 메시지 표시
      if (sheetErr.status === 403) {
        throw new Error(`시트 접근 권한이 없습니다. ID: ${SHEET_ID}. 시트 우측 상단 '공유'에서 본인 이메일이 '편집자'인지 확인해주세요.`);
      }
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
      requestBody: {
        values: [row],
      },
    });

    console.log("Success! OAuth 2.0 flow completed.");
    return NextResponse.json({ docUrl, docId, message: "구글 본인 계정에 저장 완료!" });

  } catch (error: any) {
    console.error(`Error at ${currentStep}:`, error);
    
    let detail = error?.message || "알 수 없는 오류";
    if (error?.response?.data?.error?.message) {
      detail = error.response.data.error.message;
    }

    return NextResponse.json({ 
      error: `[위치]: ${currentStep}\n[사유]: ${detail}\n\n* Client ID, Secret, Refresh Token이 정확한지 Vercel 환경 변수를 다시 확인해 주세요.` 
    }, { status: 500 });
  }
}
