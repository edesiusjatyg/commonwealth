import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Wallet } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { budgetData, chartConfig } from "./constants";

interface BudgetChartProps {
	totalBudget: number;
}

export function BudgetChart({ totalBudget }: BudgetChartProps) {
	return (
		<Card className="border-0 bg-transparent shadow-none">
			<CardContent className="pt-6">
				<div className="relative flex flex-col items-center">
					<ChartContainer config={chartConfig} className="h-[220px] w-[220px]">
						<PieChart>
							<ChartTooltip content={<ChartTooltipContent hideLabel />} />
							<Pie
								data={budgetData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={90}
								strokeWidth={2}
								stroke="hsl(var(--background))"
							>
								{budgetData.map((entry) => (
									<Cell key={entry.name} fill={entry.fill} />
								))}

								<Label
									content={({ viewBox }) => {
										if (viewBox && "cx" in viewBox && "cy" in viewBox) {
											return (
												<text
													x={viewBox.cx}
													y={viewBox.cy}
													textAnchor="middle"
													dominantBaseline="middle"
												>
													<tspan
														x={viewBox.cx}
														y={(viewBox.cy || 0) - 8}
														className="fill-muted-foreground text-xs"
													>
														<Wallet className="inline h-4 w-4" />
													</tspan>
													<tspan
														x={viewBox.cx}
														y={viewBox.cy}
														className="fill-foreground font-bold text-xl"
													>
														${totalBudget.toLocaleString()}
													</tspan>
													<tspan
														x={viewBox.cx}
														y={(viewBox.cy || 0) + 18}
														className="fill-muted-foreground text-xs"
													>
														Available Budget
													</tspan>
												</text>
											);
										}
										return null;
									}}
								/>
							</Pie>
						</PieChart>
					</ChartContainer>

					<div className="mt-4 flex flex-wrap justify-center gap-3">
						{budgetData.map((item) => (
							<Badge
								key={item.name}
								variant="outline"
								className="flex items-center gap-1.5 px-2 py-1"
							>
								<span
									className="h-2 w-2 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span className="text-xs">
									{item.name} - {item.value}%
								</span>
							</Badge>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
