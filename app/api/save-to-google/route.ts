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
    ],
  });

  return { auth, keyJson };
}

export async function POST(req: Request) {
  let currentStep = "인증 정보 준비";
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

    // --- 1. Google Docs에 문서 생성 ---
    currentStep = "Step 1: Google Docs 문서 생성";
    console.log(currentStep);
    
    const docTitle = `[SEO] ${topicTitle} - ${new Date().toLocaleDateString("ko-KR")}`;
    const createRes = await docs.documents.create({
      requestBody: { title: docTitle },
    });

    const docId = createRes.data.documentId!;
    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    // 본문 삽입
    currentStep = "Step 2: Docs 본문 내용 삽입";
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

    // 폴더로 이동 (비필수)
    if (folderId) {
      currentStep = "Step 2.5: 폴더 이동 (선택 사항)";
      try {
        const file = await drive.files.get({ fileId: docId, fields: "parents" });
        const previousParents = (file.data.parents || []).join(",");
        await drive.files.update({
          fileId: docId,
          addParents: folderId,
          removeParents: previousParents,
          fields: "id, parents",
        });
      } catch (e) { console.error("Folder move failed", e); }
    }

    // 문서 권한 설정 (비필수)
    currentStep = "Step 2.8: 문서 공유 권한 설정 (선택 사항)";
    try {
      await drive.permissions.create({
        fileId: docId,
        requestBody: { role: "reader", type: "anyone" },
      });
    } catch (e) { console.error("Permission set failed", e); }

    // --- 2. Google Sheets에 아카이빙 ---
    currentStep = "Step 3: Google Sheets 정보 확인";
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID || "1_uT4vIH9wsagpfiSepHKWAQ_h_J0cZG8z956R2ibWRs";
    
    let targetRange = "A:H";
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
      const firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title;
      if (firstSheetName) {
        targetRange = `${firstSheetName}!A:H`;
      }
    } catch (sheetErr: any) {
      console.error("Sheet Get Failed", sheetErr);
      if (sheetErr.status === 403) {
        throw new Error(`시트 접근 권한이 없습니다. ID: ${SHEET_ID}`);
      }
    }

    currentStep = "Step 4: Google Sheets 데이터 추가(Append)";
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

    return NextResponse.json({ docUrl, docId, message: "저장 성공!" });
  } catch (error: any) {
    console.error(`Error at ${currentStep}:`, error);
    
    let detail = error?.message || "상세 사유 알 수 없음";
    if (error?.response?.data?.error?.message) {
      detail = error.response.data.error.message;
    }

    return NextResponse.json({ 
      error: `Google 저장 실패!\n[위치]: ${currentStep}\n[사유]: ${detail}\n[연결 계정]: ${clientEmail}\n\n* 위 계정이 해당 문서/시트에 '편집자'로 추가되어 있는지, 그리고 Cloud Console에서 관련 API가 켜져 있는지 확인해 주세요.` 
    }, { status: 500 });
  }
}
