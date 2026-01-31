import { AlertCircle, Wallet } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExpenseBreakdownItem } from "@/hooks/use-expense-breakdown";

interface BudgetChartProps {
	data: ExpenseBreakdownItem[];
	totalExpense: number;
	isLoading?: boolean;
	isEmpty?: boolean;
}

export function BudgetChart({
	data,
	totalExpense,
	isLoading,
	isEmpty,
}: BudgetChartProps) {
	// Loading state
	if (isLoading) {
		return (
			<Card className="border-0 bg-transparent shadow-none">
				<CardContent className="pt-6">
					<div className="relative flex flex-col items-center">
						<Skeleton className="h-[220px] w-[220px] rounded-full" />
						<div className="mt-4 flex flex-wrap justify-center gap-3">
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-6 w-28" />
							<Skeleton className="h-6 w-20" />
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Empty state
	if (isEmpty || data.length === 0) {
		return (
			<Card className="border-0 bg-transparent shadow-none">
				<CardContent className="pt-6">
					<div className="relative flex flex-col items-center">
						{/* Empty state circle matching pie chart dimensions */}
						<div className="relative flex h-[220px] w-[220px] items-center justify-center">
							<div className="absolute inset-0 rounded-full border-2 border-black/8 m-[-10] bg-muted/50 border-dashed" />
							<div className="relative z-10 flex flex-col items-center justify-center text-center">
								<AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
								<p className="font-medium text-foreground text-sm">
									No Expenses
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									Start tracking your spending
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Prepare data for pie chart
	const chartData = data.map((item) => ({
		name: item.category,
		value: item.percentage,
		fill: item.color,
		amount: item.amount,
	}));

	// Create chart config dynamically
	const chartConfig = data.reduce(
		(config, item) => {
			config[item.category.toLowerCase()] = {
				label: item.category,
				color: item.color,
			};
			return config;
		},
		{} as Record<string, { label: string; color: string }>,
	);

	return (
		<Card className="border-0 bg-transparent shadow-none">
			<CardContent className="pt-6">
				<div className="relative flex flex-col items-center">
					<ChartContainer config={chartConfig} className="h-[220px] w-[220px]">
						<PieChart>
							<ChartTooltip
								content={<ChartTooltipContent hideLabel />}
								formatter={(value, name, props) => {
									const payload = props.payload as { amount?: number };
									const amount = payload?.amount || 0;
									return (
										<div className="flex flex-col">
											<span className="font-medium">{name}</span>
											<span className="text-muted-foreground">
												${amount.toFixed(2)} ({Number(value).toFixed(1)}%)
											</span>
										</div>
									);
								}}
							/>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={90}
								strokeWidth={2}
								stroke="hsl(var(--background))"
							>
								{chartData.map((entry) => (
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
														${totalExpense.toFixed(2)}
													</tspan>
													<tspan
														x={viewBox.cx}
														y={(viewBox.cy || 0) + 18}
														className="fill-muted-foreground text-xs"
													>
														Total Expenses
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
						{data.map((item) => (
							<Badge
								key={item.category}
								variant="outline"
								className="flex items-center gap-1.5 px-2 py-1"
							>
								<span
									className="h-2 w-2 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span className="text-xs">
									{item.category} - {item.percentage.toFixed(1)}%
								</span>
							</Badge>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
