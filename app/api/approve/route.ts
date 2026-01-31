
import { NextRequest, NextResponse } from "next/server";
import { approveDailyLimit } from "@/app/server/wallet";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const walletId = searchParams.get("walletId");
    const code = searchParams.get("code");

    function renderPage(title: string, message: string, isError: boolean = false) {
        return new NextResponse(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: -apple-system, system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f0f0; }
                    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; width: 90%; text-align: center; }
                    h1 { color: #333; margin-top: 0; }
                    p { color: #666; line-height: 1.5; }
                    .icon { font-size: 48px; margin-bottom: 1rem; display: block; }
                    .success { color: #10B981; }
                    .error { color: #EF4444; }
                </style>
            </head>
            <body>
                <div class="card">
                    <span class="icon">${isError ? "❌" : "✅"}</span>
                    <h1>${title}</h1>
                    <p>${message}</p>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' },
        });
    }

    if (!walletId || !code) {
        return renderPage("Invalid Request", "Missing wallet ID or approval code.", true);
    }

    const result = await approveDailyLimit({
        walletId,
        approvalCode: code
    });

    if (result.error) {
        return renderPage("Approval Failed", result.error, true);
    }

    return renderPage("Approved!", "The daily limit override has been successfully approved.");
}
