import { delayedValue } from "@/lib/utils";

const mockInsight = () =>
	"Portfolio summary: your wallet holds 3 main assets with a combined estimated value of ~$12,450. Performance: the portfolio is down 4.1% Portfolio summary: your wallet holds 3 main assets with a combined estimated value of ~$12,450. Performance: the portfolio is down 4.1%";

export async function WalletInsightContent() {
	const insight = await delayedValue(mockInsight());

	return <p>{insight}</p>;
}
