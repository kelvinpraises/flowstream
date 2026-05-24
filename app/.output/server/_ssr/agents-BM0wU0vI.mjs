import { o as __toESM } from "../_runtime.mjs";
import { c as mockAgents, s as formatUSDCFull } from "./format-D011AXfE.mjs";
import { C as n$1, P as require_react, T as c, c as c$1, h as i, j as s$1, m as n, p as s, v as n$2 } from "../_libs/phosphor-icons__react+react.mjs";
import { f as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as motion, o as AnimatePresence } from "../_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agents-BM0wU0vI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var tabs = [
	{
		key: "all",
		label: "All"
	},
	{
		key: "bookmaker",
		label: "Bookmakers"
	},
	{
		key: "steward",
		label: "Stewards"
	},
	{
		key: "observer",
		label: "Observers"
	}
];
function AgentsPage() {
	const [filter, setFilter] = (0, import_react.useState)("all");
	const sorted = [...filter === "all" ? mockAgents : mockAgents.filter((a) => a.role === filter)].sort((a, b) => b.reputation - a.reputation);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			overflowY: "auto",
			height: "calc(100vh - 56px)"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			style: {
				padding: "48px 24px 0",
				maxWidth: 960,
				margin: "0 auto"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 12,
						marginBottom: 8
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n, {
						size: 24,
						color: "#00ff87"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "display",
						style: {
							fontSize: 28,
							fontWeight: 700,
							color: "#fff",
							letterSpacing: "0.02em"
						},
						children: "Agent Leaderboard"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontSize: 14,
						color: "rgba(255,255,255,0.4)",
						marginBottom: 28,
						maxWidth: 480
					},
					children: "Autonomous agents that create markets, resolve outcomes, and observe streams. Ranked by reputation."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(3, 1fr)",
						gap: 12,
						marginBottom: 28
					},
					children: [
						{
							label: "BOOKMAKERS",
							value: mockAgents.filter((a) => a.role === "bookmaker").length,
							accent: "#00ff87"
						},
						{
							label: "STEWARDS",
							value: mockAgents.filter((a) => a.role === "steward").length,
							accent: "#ffd553"
						},
						{
							label: "OBSERVERS",
							value: mockAgents.filter((a) => a.role === "observer").length,
							accent: "#00c8ff"
						}
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							background: "rgba(255,255,255,0.025)",
							border: "1px solid rgba(255,255,255,0.06)",
							borderRadius: 10,
							padding: "14px 16px"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 9,
								color: "rgba(255,255,255,0.3)",
								letterSpacing: "0.08em",
								marginBottom: 4,
								fontFamily: "var(--font-mono)"
							},
							children: s.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono",
							style: {
								fontSize: 22,
								fontWeight: 700,
								color: s.accent
							},
							children: s.value
						})]
					}, s.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "flex",
						gap: 4,
						borderBottom: "1px solid rgba(255,255,255,0.07)",
						marginBottom: 20
					},
					children: tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFilter(tab.key),
						className: filter === tab.key ? "tab-active" : "",
						style: {
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: "10px 16px 11px",
							fontSize: 12,
							fontWeight: 700,
							letterSpacing: "0.08em",
							fontFamily: "var(--font-mono)",
							color: filter === tab.key ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
							position: "relative",
							transition: "color 0.15s cubic-bezier(0.23, 1, 0.32, 1)"
						},
						children: tab.label.toUpperCase()
					}, tab.key))
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			style: {
				padding: "0 24px 48px",
				maxWidth: 960,
				margin: "0 auto"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 8
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
					mode: "popLayout",
					children: sorted.map((agent, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentCard, {
						agent,
						rank: i + 1
					}, agent.id))
				})
			})
		})]
	});
}
var roleConfig = {
	bookmaker: {
		icon: c,
		color: "#00ff87",
		label: "Bookmaker"
	},
	steward: {
		icon: s,
		color: "#ffd553",
		label: "Steward"
	},
	observer: {
		icon: n$1,
		color: "#00c8ff",
		label: "Observer"
	}
};
function AgentCard({ agent, rank }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const rc = roleConfig[agent.role];
	const RoleIcon = rc.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		layout: true,
		initial: {
			opacity: 0,
			transform: "translateY(8px)"
		},
		animate: {
			opacity: 1,
			transform: "translateY(0px)"
		},
		exit: {
			opacity: 0,
			transform: "translateY(-6px)"
		},
		transition: {
			type: "spring",
			stiffness: 320,
			damping: 30
		},
		style: {
			background: "var(--color-bg-card)",
			border: "1px solid rgba(255,255,255,0.06)",
			borderRadius: 12,
			overflow: "hidden",
			transition: "border-color 0.2s"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onClick: () => setExpanded((e) => !e),
			style: {
				padding: "14px 18px",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				gap: 14
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						width: 32,
						minWidth: 32,
						textAlign: "center"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mono",
						style: {
							fontSize: rank <= 3 ? 16 : 14,
							fontWeight: 700,
							color: rank === 1 ? "#ffd553" : rank === 2 ? "#c0c0c0" : rank === 3 ? "#cd7f32" : "rgba(255,255,255,0.2)"
						},
						children: ["#", rank]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						width: 40,
						height: 40,
						borderRadius: 10,
						background: `${rc.color}12`,
						border: `1px solid ${rc.color}25`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleIcon, {
						size: 18,
						color: rc.color
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						flex: 1,
						minWidth: 0
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8,
							marginBottom: 3
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "display",
							style: {
								fontSize: 14,
								fontWeight: 600,
								color: "rgba(255,255,255,0.9)",
								letterSpacing: "0.01em"
							},
							children: agent.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 10,
								fontWeight: 600,
								color: rc.color,
								background: `${rc.color}12`,
								border: `1px solid ${rc.color}25`,
								padding: "1px 8px",
								borderRadius: 4,
								fontFamily: "var(--font-mono)"
							},
							children: rc.label
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono",
						style: {
							fontSize: 11,
							color: "rgba(255,255,255,0.25)"
						},
						children: agent.address
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 20
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { textAlign: "right" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 9,
									color: "rgba(255,255,255,0.25)",
									fontFamily: "var(--font-mono)",
									letterSpacing: "0.06em",
									marginBottom: 2
								},
								children: "ACCURACY"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mono",
								style: {
									fontSize: 14,
									fontWeight: 700,
									color: agent.accuracy >= 90 ? "#00ff87" : agent.accuracy >= 70 ? "#ffd553" : "#ff7a00"
								},
								children: [agent.accuracy, "%"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { textAlign: "right" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 9,
									color: "rgba(255,255,255,0.25)",
									fontFamily: "var(--font-mono)",
									letterSpacing: "0.06em",
									marginBottom: 2
								},
								children: "REPUTATION"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 6
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										width: 48,
										height: 4,
										background: "rgba(255,255,255,0.08)",
										borderRadius: 2,
										overflow: "hidden"
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
										width: `${agent.reputation}%`,
										height: "100%",
										background: agent.reputation >= 90 ? "#00ff87" : agent.reputation >= 70 ? "#ffd553" : "#ff7a00",
										borderRadius: 2
									} })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono",
									style: {
										fontSize: 12,
										fontWeight: 600,
										color: "rgba(255,255,255,0.6)"
									},
									children: agent.reputation
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
							animate: { rotate: expanded ? 180 : 0 },
							transition: {
								type: "spring",
								stiffness: 400,
								damping: 25
							},
							style: { color: "rgba(255,255,255,0.2)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$1, { size: 16 })
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
			initial: {
				height: 0,
				opacity: 0
			},
			animate: {
				height: "auto",
				opacity: 1
			},
			exit: {
				height: 0,
				opacity: 0
			},
			transition: {
				type: "spring",
				stiffness: 350,
				damping: 32
			},
			style: { overflow: "hidden" },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					borderTop: "1px solid rgba(255,255,255,0.06)",
					padding: "16px 18px",
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: 12
				},
				children: [
					agent.role === "bookmaker" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: c,
							label: "Win Rate",
							value: `${agent.winRate}%`,
							accent: "#00ff87"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: i,
							label: "Vaults Created",
							value: agent.vaultsCreated.toString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: c$1,
							label: "Volume",
							value: formatUSDCFull(agent.totalVolume),
							accent: "#00c8ff"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: n$2,
							label: "Reputation",
							value: agent.reputation.toString(),
							accent: "#ffd553"
						})
					] }),
					agent.role === "steward" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: s,
							label: "Resolutions",
							value: (agent.resolutionsConfirmed ?? 0).toString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: i,
							label: "Proposals",
							value: (agent.proposals ?? 0).toString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: c,
							label: "Success Rate",
							value: `${agent.successRate ?? 0}%`,
							accent: "#00ff87"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: n$2,
							label: "Vetos Used",
							value: (agent.vetosUsed ?? 0).toString(),
							accent: agent.vetosUsed ? "#ff2d78" : "rgba(255,255,255,0.5)"
						})
					] }),
					agent.role === "observer" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: n$1,
							label: "Batches",
							value: (agent.batchesSubmitted ?? 0).toLocaleString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: i,
							label: "Vaults Served",
							value: agent.vaultsMonitored.toString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: c$1,
							label: "Uptime",
							value: `${agent.uptime ?? 0}%`,
							accent: "#00ff87"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCell, {
							icon: n$2,
							label: "Reputation",
							value: agent.reputation.toString(),
							accent: "#ffd553"
						})
					] })
				]
			})
		}) })]
	});
}
function StatCell({ icon: Icon, label, value, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 4,
			marginBottom: 4
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			size: 10,
			color: "rgba(255,255,255,0.25)"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: {
				fontSize: 9,
				color: "rgba(255,255,255,0.25)",
				letterSpacing: "0.06em",
				fontFamily: "var(--font-mono)"
			},
			children: label.toUpperCase()
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "mono",
		style: {
			fontSize: 15,
			fontWeight: 700,
			color: accent ?? "rgba(255,255,255,0.75)"
		},
		children: value
	})] });
}
//#endregion
export { AgentsPage as component };
