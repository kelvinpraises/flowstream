//#region node_modules/.nitro/vite/services/ssr/assets/format-D011AXfE.js
var mockVaults = [
	{
		id: "0x1a2b",
		option: "Speaker addresses regulation next",
		type: "momentum",
		creator: "0xsteward",
		noTotal: 185,
		yesTotal: 94,
		status: "open",
		hotUntil: null,
		createdAt: Date.now() - 24e4,
		expiresAt: Date.now() + 18e4,
		outcome: "pending",
		multiplier: 2.31,
		createdMinute: 38,
		userPosition: {
			side: "yes",
			streamed: 25,
			shares: 34,
			currentValue: 28.5
		}
	},
	{
		id: "0x3c4d",
		option: "Audience question within 5 minutes",
		type: "timing",
		creator: "0xsteward",
		noTotal: 210,
		yesTotal: 128,
		status: "hot",
		hotUntil: Date.now() + 42e3,
		createdAt: Date.now() - 6e5,
		expiresAt: Date.now() + 48e4,
		outcome: "pending",
		multiplier: 1.83,
		exitBurn: 20,
		createdMinute: 32
	},
	{
		id: "0x5e6f",
		option: "Panel reaches consensus on AI safety",
		type: "threshold",
		creator: "0xsteward",
		noTotal: 88,
		yesTotal: 192,
		status: "resolved",
		hotUntil: null,
		createdAt: Date.now() - 18e5,
		expiresAt: Date.now() - 3e5,
		outcome: "yes",
		multiplier: 1,
		createdMinute: 15,
		userPosition: {
			side: "yes",
			streamed: 22,
			shares: 30,
			currentValue: 26.98
		},
		userWon: true,
		payout: 26.98
	},
	{
		id: "0x7a8b",
		option: "Surprise guest appearance before end",
		type: "swing",
		creator: "0xsteward",
		noTotal: 320,
		yesTotal: 65,
		status: "resolved",
		hotUntil: null,
		createdAt: Date.now() - 24e5,
		expiresAt: Date.now() - 9e5,
		outcome: "no",
		multiplier: 1,
		createdMinute: 8,
		userPosition: {
			side: "yes",
			streamed: 30,
			shares: 38,
			currentValue: 0
		},
		userWon: false,
		flowReceived: 152
	},
	{
		id: "0x9c0d",
		option: "Viewer count exceeds 20k",
		type: "timing",
		creator: "0xsteward",
		noTotal: 72,
		yesTotal: 48,
		status: "open",
		hotUntil: null,
		createdAt: Date.now() - 6e4,
		expiresAt: Date.now() + 24e4,
		outcome: "pending",
		multiplier: 2.67,
		createdMinute: 43
	}
];
var mockEvents = [
	{
		id: "e1",
		t: "alert",
		min: 45,
		desc: "AI detected key moment — speaker tone shifted significantly"
	},
	{
		id: "e2",
		t: "vault_created",
		min: 43,
		desc: "New vault: \"Viewer count exceeds 20k\""
	},
	{
		id: "e3",
		t: "stream_surge",
		min: 40,
		desc: "YES volume surged 3x on \"Speaker addresses regulation\" vault"
	},
	{
		id: "e4",
		t: "hot_period",
		min: 38,
		desc: "\"Audience question within 5 minutes\" entered hot period"
	},
	{
		id: "e5",
		t: "alert",
		min: 35,
		desc: "Significant audience reaction — sentiment shift detected"
	},
	{
		id: "e6",
		t: "resolved",
		min: 32,
		desc: "\"Opening remarks exceed 10 min\" resolved YES"
	},
	{
		id: "e7",
		t: "milestone",
		min: 30,
		desc: "Stream crossed 15,000 concurrent viewers"
	},
	{
		id: "e8",
		t: "vault_created",
		min: 28,
		desc: "New vault: \"Speaker addresses regulation next\""
	},
	{
		id: "e9",
		t: "stream_surge",
		min: 25,
		desc: "Total pooled crossed $3,000 — volume milestone"
	},
	{
		id: "e10",
		t: "system",
		min: 22,
		desc: "Observer batch #1240 submitted to IPFS"
	},
	{
		id: "e11",
		t: "alert",
		min: 18,
		desc: "AI confidence spike — strong prediction signal"
	},
	{
		id: "e12",
		t: "resolved",
		min: 15,
		desc: "\"Panel reaches consensus\" resolved YES — $280 distributed"
	}
];
var mockFlow = {
	balance: 1250,
	staked: 800,
	pendingDividends: 12.48,
	totalEarned: 87.2,
	apy: 14.2
};
var mockWallet = {
	address: "0x4a7f...93be",
	usdcBalance: 3820.3,
	connected: false,
	sessionKeySigned: false
};
var mockPositions = [
	{
		vaultId: "0x1a2b",
		option: "Speaker addresses regulation next",
		side: "yes",
		streamed: 25,
		streamRate: .8,
		shares: 34,
		currentValue: 28.5,
		pnl: 3.5,
		resolved: false,
		minute: 38
	},
	{
		vaultId: "0x5e6f",
		option: "Panel reaches consensus on AI safety",
		side: "yes",
		streamed: 22,
		streamRate: 0,
		shares: 30,
		currentValue: 26.98,
		pnl: 4.98,
		resolved: true,
		won: true,
		payout: 26.98,
		minute: 15
	},
	{
		vaultId: "0x7a8b",
		option: "Surprise guest appearance before end",
		side: "yes",
		streamed: 30,
		streamRate: 0,
		shares: 38,
		currentValue: 0,
		pnl: -30,
		resolved: true,
		won: false,
		minute: 8
	}
];
var mockFrame = {
	frame: 7430,
	ts: Date.now(),
	events: [],
	min: 45
};
var mockStreams = [
	{
		id: "tech-1",
		title: "AI & Prediction Markets — Live Panel",
		category: "Tech",
		viewers: 14820,
		activeVaults: 5,
		totalPooled: 3820.3,
		elapsed: "45m",
		isLive: true
	},
	{
		id: "esports-1",
		title: "LCS Finals — Game 3",
		category: "Esports",
		viewers: 8340,
		activeVaults: 4,
		totalPooled: 2100,
		elapsed: "32m",
		isLive: true
	},
	{
		id: "politics-1",
		title: "Town Hall Debate: Climate Policy",
		category: "Politics",
		viewers: 22510,
		activeVaults: 3,
		totalPooled: 1500,
		elapsed: "1h 15m",
		isLive: true
	},
	{
		id: "entertainment-1",
		title: "MasterChef Live Semi-Finals",
		category: "Entertainment",
		viewers: 5670,
		activeVaults: 2,
		totalPooled: 890,
		elapsed: "25m",
		isLive: true
	}
];
var mockLiveVaults = [
	{
		id: "lv-1",
		streamId: "tech-1",
		streamTitle: "AI & Prediction Markets",
		option: "Speaker addresses regulation next",
		multiplier: 2.31,
		totalPool: 279,
		status: "open",
		expiresIn: 180
	},
	{
		id: "lv-2",
		streamId: "esports-1",
		streamTitle: "LCS Finals",
		option: "Team Alpha wins Game 3",
		multiplier: 1.92,
		totalPool: 485,
		status: "hot",
		expiresIn: 45
	},
	{
		id: "lv-3",
		streamId: "politics-1",
		streamTitle: "Town Hall Debate",
		option: "Candidate X gets more applause next",
		multiplier: 3.1,
		totalPool: 312,
		status: "open",
		expiresIn: 300
	},
	{
		id: "lv-4",
		streamId: "tech-1",
		streamTitle: "AI & Prediction Markets",
		option: "Audience question within 5 minutes",
		multiplier: 1.83,
		totalPool: 338,
		status: "hot",
		expiresIn: 42
	},
	{
		id: "lv-5",
		streamId: "entertainment-1",
		streamTitle: "MasterChef Live",
		option: "Chef Rivera survives elimination",
		multiplier: 1.45,
		totalPool: 210,
		status: "open",
		expiresIn: 600
	}
];
var mockLifetimeVaults = [
	{
		id: "lt-1",
		option: "Panel reaches consensus on AI safety",
		streamTitle: "AI & Prediction Markets",
		outcome: "yes",
		totalPool: 280,
		resolvedAt: Date.now() - 36e5,
		yesTotal: 192,
		noTotal: 88
	},
	{
		id: "lt-2",
		option: "Speaker endorses open-source approach",
		streamTitle: "AI & Prediction Markets",
		outcome: "no",
		totalPool: 385,
		resolvedAt: Date.now() - 72e5,
		yesTotal: 65,
		noTotal: 320
	},
	{
		id: "lt-3",
		option: "Chef Rivera survives first round",
		streamTitle: "MasterChef Live",
		outcome: "yes",
		totalPool: 210,
		resolvedAt: Date.now() - 108e5,
		yesTotal: 155,
		noTotal: 55
	},
	{
		id: "lt-4",
		option: "Candidate X gets standing ovation",
		streamTitle: "Town Hall Debate",
		outcome: "no",
		totalPool: 440,
		resolvedAt: Date.now() - 144e5,
		yesTotal: 180,
		noTotal: 260
	},
	{
		id: "lt-5",
		option: "Team Alpha takes first blood in Game 2",
		streamTitle: "LCS Finals",
		outcome: "yes",
		totalPool: 520,
		resolvedAt: Date.now() - 18e6,
		yesTotal: 340,
		noTotal: 180
	}
];
var mockProtocolStats = {
	totalVaults: 142,
	totalVolume: 284390,
	activeStreams: 4,
	activeAgents: 12
};
var mockAgents = [
	{
		id: "a1",
		name: "MomentumBot",
		address: "0x3f8c...a21d",
		role: "bookmaker",
		accuracy: 78,
		winRate: 78,
		vaultsCreated: 42,
		vaultsMonitored: 42,
		totalVolume: 12400,
		reputation: 88
	},
	{
		id: "a2",
		name: "Guardian1",
		address: "0x7b2e...f84c",
		role: "steward",
		accuracy: 92,
		winRate: 92,
		vaultsCreated: 0,
		vaultsMonitored: 15,
		totalVolume: 0,
		resolutionsConfirmed: 15,
		proposals: 3,
		vetosUsed: 0,
		reputation: 95,
		successRate: 92
	},
	{
		id: "a3",
		name: "SharpEye",
		address: "0x1a9d...c7e3",
		role: "observer",
		accuracy: 99,
		winRate: 99,
		vaultsCreated: 0,
		vaultsMonitored: 8,
		totalVolume: 0,
		batchesSubmitted: 1240,
		uptime: 99.2,
		reputation: 97
	},
	{
		id: "a4",
		name: "PatternHunter",
		address: "0x5e6f...b92a",
		role: "bookmaker",
		accuracy: 65,
		winRate: 65,
		vaultsCreated: 28,
		vaultsMonitored: 28,
		totalVolume: 8700,
		reputation: 72
	},
	{
		id: "a5",
		name: "ProtocolWatch",
		address: "0x8d4a...e15f",
		role: "steward",
		accuracy: 100,
		winRate: 100,
		vaultsCreated: 0,
		vaultsMonitored: 8,
		totalVolume: 0,
		resolutionsConfirmed: 8,
		proposals: 1,
		vetosUsed: 1,
		reputation: 91,
		successRate: 100
	},
	{
		id: "a6",
		name: "QuickDraw",
		address: "0x2c7b...d43e",
		role: "bookmaker",
		accuracy: 71,
		winRate: 71,
		vaultsCreated: 35,
		vaultsMonitored: 35,
		totalVolume: 9850,
		reputation: 80
	},
	{
		id: "a7",
		name: "SentinelV2",
		address: "0x6f3a...18bc",
		role: "observer",
		accuracy: 98,
		winRate: 98,
		vaultsCreated: 0,
		vaultsMonitored: 12,
		totalVolume: 0,
		batchesSubmitted: 2810,
		uptime: 98.7,
		reputation: 94
	},
	{
		id: "a8",
		name: "ArbiterDAO",
		address: "0x9e1c...72af",
		role: "steward",
		accuracy: 87,
		winRate: 87,
		vaultsCreated: 0,
		vaultsMonitored: 6,
		totalVolume: 0,
		resolutionsConfirmed: 6,
		proposals: 2,
		vetosUsed: 0,
		reputation: 82,
		successRate: 87
	}
];
function formatUSDC(n, decimals = 2) {
	if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "k";
	return "$" + n.toFixed(decimals);
}
function formatUSDCFull(n) {
	return "$" + n.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}
function formatFlow(n) {
	return n.toLocaleString("en-US") + " $FLOW";
}
function formatMultiplier(n) {
	return n.toFixed(2) + "x";
}
function formatCountdown(ms) {
	if (ms <= 0) return "0:00";
	const s = Math.floor(ms / 1e3);
	return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
function formatRate(usdcPerMin) {
	if (usdcPerMin < .01) return "—";
	return "$" + usdcPerMin.toFixed(2) + "/min";
}
function calcPoolPct(noTotal, yesTotal) {
	const total = noTotal + yesTotal;
	return total === 0 ? .5 : yesTotal / total;
}
//#endregion
export { mockVaults as _, formatRate as a, mockAgents as c, mockFrame as d, mockLifetimeVaults as f, mockStreams as g, mockProtocolStats as h, formatMultiplier as i, mockEvents as l, mockPositions as m, formatCountdown as n, formatUSDC as o, mockLiveVaults as p, formatFlow as r, formatUSDCFull as s, calcPoolPct as t, mockFlow as u, mockWallet as v };
