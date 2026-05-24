import { f as mockLifetimeVaults, g as mockStreams, h as mockProtocolStats, p as mockLiveVaults, s as formatUSDCFull } from "./format-D011AXfE.mjs";
import { C as n$1, D as n$4, N as s, O as s$2, S as s$4, a as n$3, g as n$2, s as s$1, t as s$3, u as n, w as m } from "../_libs/phosphor-icons__react+react.mjs";
import { d as Link, f as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as motion } from "../_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-VNjOTA-w.js
var import_jsx_runtime = require_jsx_runtime();
function HomePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			overflowY: "auto",
			height: "calc(100vh - 56px)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				style: {
					padding: "100px 24px 80px",
					position: "relative",
					overflow: "hidden"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ambient-mesh",
						style: {
							position: "absolute",
							inset: 0,
							pointerEvents: "none"
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
						position: "absolute",
						top: "30%",
						left: 0,
						right: 0,
						height: 1,
						background: "linear-gradient(90deg, transparent, rgba(0,255,135,0.06), transparent)",
						pointerEvents: "none"
					} }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
						position: "absolute",
						top: "70%",
						left: 0,
						right: 0,
						height: 1,
						background: "linear-gradient(90deg, transparent, rgba(255,45,120,0.04), transparent)",
						pointerEvents: "none"
					} }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							position: "relative",
							zIndex: 1,
							maxWidth: 800,
							margin: "0 auto",
							textAlign: "center"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
								initial: {
									opacity: 0,
									transform: "translateY(12px)"
								},
								animate: {
									opacity: 1,
									transform: "translateY(0px)"
								},
								transition: {
									delay: .1,
									duration: .4
								},
								style: { marginBottom: 32 },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										display: "inline-flex",
										alignItems: "center",
										gap: 8,
										background: "rgba(0,255,135,0.06)",
										border: "1px solid rgba(0,255,135,0.18)",
										borderRadius: 20,
										padding: "5px 16px"
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "live-dot",
										style: {
											width: 6,
											height: 6,
											borderRadius: "50%",
											background: "#00ff87"
										}
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 11,
											fontWeight: 600,
											color: "#00ff87",
											fontFamily: "var(--font-mono)",
											letterSpacing: "0.08em"
										},
										children: "LIVE ON ARC"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "broadcast-corners",
								style: {
									display: "inline-block",
									padding: "8px 24px",
									marginBottom: 28
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.h1, {
									className: "display",
									style: {
										lineHeight: 1.2,
										letterSpacing: "-0.01em"
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
											initial: {
												opacity: 0,
												transform: "translateY(20px)",
												filter: "blur(6px)"
											},
											animate: {
												opacity: 1,
												transform: "translateY(0px)",
												filter: "blur(0px)"
											},
											transition: {
												delay: .2,
												duration: .5,
												ease: [
													.16,
													1,
													.3,
													1
												]
											},
											style: {
												display: "block",
												fontSize: 48,
												fontWeight: 700,
												color: "#fff"
											},
											children: "Any live stream."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
											initial: {
												opacity: 0,
												transform: "translateY(20px)",
												filter: "blur(6px)"
											},
											animate: {
												opacity: 1,
												transform: "translateY(0px)",
												filter: "blur(0px)"
											},
											transition: {
												delay: .35,
												duration: .5,
												ease: [
													.16,
													1,
													.3,
													1
												]
											},
											className: "text-prismatic",
											style: {
												display: "block",
												fontSize: 48,
												fontWeight: 700
											},
											children: "Any prediction."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
											initial: {
												opacity: 0,
												transform: "translateY(20px)",
												filter: "blur(6px)"
											},
											animate: {
												opacity: 1,
												transform: "translateY(0px)",
												filter: "blur(0px)"
											},
											transition: {
												delay: .5,
												duration: .5,
												ease: [
													.16,
													1,
													.3,
													1
												]
											},
											style: {
												display: "block",
												fontSize: 36,
												fontWeight: 500,
												color: "rgba(255,255,255,0.35)",
												marginTop: 4
											},
											children: "Every loss creates an owner."
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
								initial: { opacity: 0 },
								animate: { opacity: 1 },
								transition: {
									delay: .7,
									duration: .4
								},
								style: {
									fontSize: 16,
									color: "rgba(255,255,255,0.4)",
									lineHeight: 1.7,
									maxWidth: 500,
									margin: "0 auto 36px",
									fontWeight: 300
								},
								children: "Watch live video. Predict what happens next with streaming USDC. AI agents create markets in real-time. Losers earn $FLOW and become protocol owners."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
								initial: {
									opacity: 0,
									transform: "translateY(10px)"
								},
								animate: {
									opacity: 1,
									transform: "translateY(0px)"
								},
								transition: {
									delay: .9,
									duration: .3
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "#streams",
									className: "cta-glow",
									style: {
										padding: "14px 30px",
										fontSize: 15,
										borderRadius: 10
									},
									children: ["Browse Live Streams ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s, { size: 16 })]
								})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				transition: {
					delay: 1,
					duration: .4
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "broadcast-rule" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 0,
							padding: "14px 24px",
							background: "rgba(255,255,255,0.015)"
						},
						children: [
							{
								label: "VAULTS",
								value: mockProtocolStats.totalVaults.toLocaleString(),
								accent: "#00ff87"
							},
							{
								label: "VOLUME",
								value: formatUSDCFull(mockProtocolStats.totalVolume),
								accent: "#00c8ff"
							},
							{
								label: "LIVE",
								value: mockProtocolStats.activeStreams.toString(),
								accent: "#ff2d78"
							},
							{
								label: "AGENTS",
								value: mockProtocolStats.activeAgents.toString(),
								accent: "#ffd553"
							}
						].map((stat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center"
							},
							children: [i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sep-dot",
								style: { fontSize: 18 },
								children: "·"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "data-tag",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "data-label",
									children: stat.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "data-value",
									style: { color: stat.accent },
									children: stat.value
								})]
							})]
						}, stat.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "broadcast-rule" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "streams",
				style: {
					padding: "48px 24px",
					maxWidth: 1120,
					margin: "0 auto"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
					initial: {
						opacity: 0,
						transform: "translateY(10px)"
					},
					animate: {
						opacity: 1,
						transform: "translateY(0px)"
					},
					transition: {
						delay: 1.1,
						duration: .3
					},
					style: {
						display: "flex",
						alignItems: "center",
						gap: 10,
						marginBottom: 24
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "live-dot",
						style: {
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: "#ff2d78",
							boxShadow: "0 0 8px #ff2d78"
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "display",
						style: {
							fontSize: 22,
							fontWeight: 700,
							color: "#fff",
							letterSpacing: "0.02em"
						},
						children: "Live Now"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
						gap: 14
					},
					children: mockStreams.map((stream, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreamCard, {
						stream,
						index: i
					}, stream.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				style: {
					padding: "0 24px 48px",
					maxWidth: 1120,
					margin: "0 auto"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 10,
						marginBottom: 24
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n, {
							size: 18,
							color: "#00ff87"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "display",
							style: {
								fontSize: 22,
								fontWeight: 700,
								color: "#fff",
								letterSpacing: "0.02em"
							},
							children: "Live Vaults"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono",
							style: {
								fontSize: 11,
								color: "rgba(255,255,255,0.3)",
								marginLeft: 4
							},
							children: [mockLiveVaults.length, " active"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
						gap: 12
					},
					children: mockLiveVaults.map((vault, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveVaultCard, {
						vault,
						index: i
					}, vault.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				style: {
					padding: "0 24px 48px",
					maxWidth: 1120,
					margin: "0 auto"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "broadcast-rule",
						style: { marginBottom: 32 }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 10,
							marginBottom: 24
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$1, {
							size: 18,
							color: "#ffd553"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "display",
							style: {
								fontSize: 22,
								fontWeight: 700,
								color: "#fff",
								letterSpacing: "0.02em"
							},
							children: "Lifetime"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(3, 1fr)",
							gap: 12,
							marginBottom: 20
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
									children: "RESOLVED"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mono",
									style: {
										fontSize: 20,
										fontWeight: 700,
										color: "rgba(255,255,255,0.85)"
									},
									children: mockProtocolStats.totalVaults
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
									children: "TOTAL VOLUME"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mono",
									style: {
										fontSize: 20,
										fontWeight: 700,
										color: "#00c8ff"
									},
									children: formatUSDCFull(mockProtocolStats.totalVolume)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
									children: "YES WIN RATE"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mono",
									style: {
										fontSize: 20,
										fontWeight: 700,
										color: "#00ff87"
									},
									children: "62%"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 10,
							fontFamily: "var(--font-mono)",
							fontWeight: 600,
							letterSpacing: "0.1em",
							color: "rgba(255,255,255,0.25)",
							padding: "4px 0 10px"
						},
						children: "RECENT RESOLUTIONS"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: 6
						},
						children: mockLifetimeVaults.map((vault) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 12,
								background: "rgba(255,255,255,0.02)",
								border: "1px solid rgba(255,255,255,0.04)",
								borderRadius: 8,
								padding: "10px 14px"
							},
							children: [
								vault.outcome === "yes" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$2, {
									size: 14,
									color: "#00ff87",
									weight: "fill"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$3, {
									size: 14,
									color: "#ff2d78"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: {
										flex: 1,
										fontSize: 13,
										color: "rgba(255,255,255,0.7)",
										fontWeight: 500
									},
									children: vault.option
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 11,
										color: "rgba(255,255,255,0.25)"
									},
									children: vault.streamTitle
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono",
									style: {
										fontSize: 11,
										fontWeight: 600,
										color: vault.outcome === "yes" ? "#00ff87" : "#ff2d78",
										marginLeft: 8
									},
									children: vault.outcome.toUpperCase()
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mono",
									style: {
										fontSize: 11,
										color: "rgba(255,255,255,0.35)",
										marginLeft: 4
									},
									children: ["$", vault.totalPool]
								})
							]
						}, vault.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				style: {
					padding: "48px 24px 64px",
					maxWidth: 1120,
					margin: "0 auto",
					position: "relative"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "broadcast-rule",
						style: { marginBottom: 48 }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "display",
						style: {
							fontSize: 22,
							fontWeight: 700,
							color: "#fff",
							textAlign: "center",
							marginBottom: 48,
							letterSpacing: "0.02em"
						},
						children: "How It Works"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(3, 1fr)",
							gap: 20
						},
						children: [
							{
								step: "01",
								icon: n$1,
								title: "Watch",
								desc: "Tune into any live stream. AI agents analyze the video and generate real-time prediction markets.",
								accent: "#00ff87"
							},
							{
								step: "02",
								icon: n$2,
								title: "Predict",
								desc: "Stream USDC into YES or NO positions. No \"place bet\" button — your money flows continuously.",
								accent: "#00c8ff"
							},
							{
								step: "03",
								icon: s$1,
								title: "Earn",
								desc: "Win and collect USDC. Lose and receive $FLOW tokens — every loss makes you a protocol owner.",
								accent: "#ffd553"
							}
						].map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							initial: {
								opacity: 0,
								transform: "translateY(16px)"
							},
							animate: {
								opacity: 1,
								transform: "translateY(0px)"
							},
							transition: { delay: .3 + i * .1 },
							className: "broadcast-corners",
							style: {
								background: "rgba(255,255,255,0.02)",
								border: "1px solid rgba(255,255,255,0.05)",
								borderRadius: 12,
								padding: "32px 24px",
								position: "relative",
								overflow: "visible"
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										position: "absolute",
										top: 12,
										right: 16,
										fontSize: 56,
										fontWeight: 700,
										fontFamily: "var(--font-display)",
										color: `${item.accent}08`,
										lineHeight: 1,
										letterSpacing: "-0.02em"
									},
									children: item.step
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										width: 40,
										height: 40,
										borderRadius: 8,
										background: `${item.accent}0a`,
										border: `1px solid ${item.accent}20`,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										marginBottom: 20
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
										size: 18,
										color: item.accent
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "display",
									style: {
										fontSize: 18,
										fontWeight: 700,
										color: "#fff",
										marginBottom: 10,
										letterSpacing: "0.02em"
									},
									children: item.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									style: {
										fontSize: 13,
										color: "rgba(255,255,255,0.38)",
										lineHeight: 1.65,
										fontWeight: 300
									},
									children: item.desc
								})
							]
						}, item.step))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "broadcast-rule" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					padding: "20px 24px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						fontSize: 11,
						color: "rgba(255,255,255,0.18)",
						fontFamily: "var(--font-mono)",
						letterSpacing: "0.06em"
					},
					children: "FLOWSTREAM PROTOCOL · BUILT ON ARC"
				})
			})] })
		]
	});
}
function StreamCard({ stream, index }) {
	const accent = {
		Tech: "#00ff87",
		Esports: "#00c8ff",
		Politics: "#ff7a00",
		Entertainment: "#ffd553"
	}[stream.category] ?? "#00ff87";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/stream/$id",
		params: { id: stream.id },
		style: { textDecoration: "none" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			initial: {
				opacity: 0,
				transform: "translateY(12px)"
			},
			animate: {
				opacity: 1,
				transform: "translateY(0px)"
			},
			transition: { delay: 1.15 + index * .06 },
			className: "glass-card",
			style: {
				cursor: "pointer",
				overflow: "hidden"
			},
			whileHover: {
				borderColor: `${accent}40`,
				boxShadow: `0 0 28px ${accent}12`
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					height: 130,
					background: `linear-gradient(135deg, ${accent}06 0%, rgba(13,13,28,0.98) 100%)`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					overflow: "hidden"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
						position: "absolute",
						inset: 0,
						background: `radial-gradient(circle at 50% 80%, ${accent}08 0%, transparent 60%)`,
						pointerEvents: "none"
					} }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							width: 48,
							height: 48,
							borderRadius: "50%",
							background: `${accent}10`,
							border: `1px solid ${accent}25`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$2, {
							size: 20,
							color: accent
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							position: "absolute",
							top: 10,
							left: 10,
							display: "flex",
							alignItems: "center",
							gap: 4,
							background: "rgba(0,0,0,0.7)",
							borderRadius: 4,
							padding: "3px 8px",
							backdropFilter: "blur(4px)"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "live-dot",
							style: {
								width: 5,
								height: 5,
								borderRadius: "50%",
								background: "#ff2d78"
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono",
							style: {
								fontSize: 9,
								fontWeight: 700,
								color: "#ff2d78",
								letterSpacing: "0.1em"
							},
							children: "LIVE"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							position: "absolute",
							top: 10,
							right: 10,
							background: `${accent}12`,
							border: `1px solid ${accent}25`,
							borderRadius: 4,
							padding: "2px 8px"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 10,
								fontWeight: 600,
								color: accent,
								fontFamily: "var(--font-mono)",
								letterSpacing: "0.04em"
							},
							children: stream.category
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { padding: "12px 14px" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						style: {
							fontSize: 13,
							fontWeight: 600,
							color: "rgba(255,255,255,0.85)",
							marginBottom: 8,
							lineHeight: 1.35,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis"
						},
						children: stream.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 12,
							flexWrap: "wrap"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 4
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$3, {
									size: 11,
									color: "rgba(255,255,255,0.3)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono",
									style: {
										fontSize: 11,
										color: "rgba(255,255,255,0.4)"
									},
									children: stream.viewers.toLocaleString()
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 4
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n, {
									size: 11,
									color: "rgba(255,255,255,0.3)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mono",
									style: {
										fontSize: 11,
										color: "rgba(255,255,255,0.4)"
									},
									children: [stream.activeVaults, " vaults"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 4
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m, {
									size: 11,
									color: "#00c8ff"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono",
									style: {
										fontSize: 11,
										color: "#00c8ff"
									},
									children: formatUSDCFull(stream.totalPooled)
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: { marginTop: 8 },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono",
							style: {
								fontSize: 10,
								color: "rgba(255,255,255,0.22)"
							},
							children: stream.elapsed
						})
					})
				]
			})]
		})
	});
}
function LiveVaultCard({ vault, index }) {
	const isHot = vault.status === "hot";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/stream/$id",
		params: { id: vault.streamId },
		style: { textDecoration: "none" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			initial: {
				opacity: 0,
				transform: "translateY(10px)"
			},
			animate: {
				opacity: 1,
				transform: "translateY(0px)"
			},
			transition: { delay: .3 + index * .05 },
			style: {
				background: "var(--color-bg-card)",
				border: `1px solid ${isHot ? "rgba(255,45,120,0.25)" : "rgba(255,255,255,0.05)"}`,
				borderRadius: 10,
				padding: "14px 16px",
				cursor: "pointer",
				transition: "border-color 0.2s, box-shadow 0.2s"
			},
			whileHover: {
				borderColor: isHot ? "rgba(255,45,120,0.5)" : "rgba(255,255,255,0.12)",
				boxShadow: isHot ? "0 0 20px rgba(255,45,120,0.08)" : "0 0 20px rgba(255,255,255,0.03)"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
						gap: 8,
						marginBottom: 8
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						style: {
							fontSize: 12,
							fontWeight: 500,
							color: "rgba(255,255,255,0.72)",
							lineHeight: 1.4,
							flex: 1
						},
						children: vault.option
					}), isHot && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 3,
							flexShrink: 0
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$4, {
							size: 11,
							color: "#ff2d78"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono",
							style: {
								fontSize: 9,
								fontWeight: 700,
								color: "#ff2d78"
							},
							children: "HOT"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 10,
							color: "rgba(255,255,255,0.25)"
						},
						children: vault.streamTitle
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mono",
						style: {
							fontSize: 13,
							fontWeight: 700,
							color: isHot ? "#ff7a00" : "#00ff87",
							textShadow: isHot ? "0 0 12px rgba(255,122,0,0.3)" : "0 0 12px rgba(0,255,135,0.2)"
						},
						children: [vault.multiplier.toFixed(2), "x"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						marginTop: 6,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 4
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 10,
								color: "rgba(255,255,255,0.2)"
							},
							children: "Pool"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono",
							style: {
								fontSize: 11,
								color: "rgba(255,255,255,0.45)"
							},
							children: ["$", vault.totalPool]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 4
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$4, {
							size: 10,
							color: "rgba(255,255,255,0.2)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono",
							style: {
								fontSize: 10,
								color: "rgba(255,255,255,0.3)"
							},
							children: [Math.floor(vault.expiresIn / 60), "m left"]
						})]
					})]
				})
			]
		})
	});
}
//#endregion
export { HomePage as component };
