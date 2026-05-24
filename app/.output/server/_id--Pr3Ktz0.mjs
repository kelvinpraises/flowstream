import { o as __toESM } from "./_runtime.mjs";
import { _ as mockVaults, a as formatRate, d as mockFrame, g as mockStreams, i as formatMultiplier, l as mockEvents, m as mockPositions, n as formatCountdown, o as formatUSDC, r as formatFlow, s as formatUSDCFull, t as calcPoolPct, u as mockFlow } from "./_ssr/format-D011AXfE.mjs";
import { A as s$1, D as n, M as n$3, O as s$2, P as require_react, S as s$3, _ as n$5, c, g as n$4, h as i, i as s, l as s$5, n as n$1, r as c$2, s as s$4, u as n$2, x as c$1, y as c$3 } from "./_libs/phosphor-icons__react+react.mjs";
import { d as Link, f as require_jsx_runtime } from "./_libs/@tanstack/react-router+[...].mjs";
import { i as motion, n as useTransform, o as AnimatePresence, r as useMotionValue, t as animate } from "./_libs/framer-motion.mjs";
import { i as useWalletContext, n as Route, t as ConnectButton } from "./_id-DcSZ1Gxn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id--Pr3Ktz0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StreamBar({ frame, streamTitle, totalPooled }) {
	const [minute, setMinute] = (0, import_react.useState)(frame.min);
	(0, import_react.useEffect)(() => {
		setMinute(frame.min);
	}, [frame.min]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "scan-line broadcast-corners",
		style: {
			background: "linear-gradient(90deg, rgba(0,255,135,0.04) 0%, rgba(13,13,28,0.98) 20%, rgba(13,13,28,0.98) 80%, rgba(0,200,255,0.04) 100%)",
			borderBottom: "1px solid rgba(255,255,255,0.07)",
			padding: "0 20px",
			height: 52,
			display: "flex",
			alignItems: "center",
			gap: 24,
			position: "relative",
			overflow: "visible",
			flexShrink: 0
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 6
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "live-dot",
					style: {
						display: "inline-block",
						width: 7,
						height: 7,
						borderRadius: "50%",
						background: "#ff2d78",
						boxShadow: "0 0 12px #ff2d78"
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "display",
					style: {
						fontSize: 11,
						fontWeight: 700,
						letterSpacing: "0.14em",
						color: "#ff2d78"
					},
					children: "LIVE"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
				width: 1,
				height: 20,
				background: "rgba(255,255,255,0.08)"
			} }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 14,
					flex: 1
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "display",
						style: {
							fontSize: 15,
							fontWeight: 700,
							color: "rgba(255,255,255,0.9)",
							letterSpacing: "0.02em"
						},
						children: streamTitle
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
						width: 1,
						height: 16,
						background: "rgba(255,255,255,0.08)"
					} }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 6
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono",
							style: {
								fontSize: 13,
								fontWeight: 600,
								color: "#00ff87"
							},
							children: [minute, "'"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 11,
								color: "rgba(255,255,255,0.3)"
							},
							children: "elapsed"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 6
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						fontSize: 11,
						color: "rgba(255,255,255,0.35)",
						letterSpacing: "0.05em"
					},
					children: "POOLED"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mono",
					style: {
						fontSize: 13,
						fontWeight: 600,
						color: "#00c8ff"
					},
					children: formatUSDCFull(totalPooled)
				})]
			})
		]
	});
}
function BalanceBar({ flow, wallet, onClaim, claiming }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const unstaked = flow.balance - flow.staked;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "balance-bar-bg",
		style: { flexShrink: 0 },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
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
				stiffness: 300,
				damping: 30,
				exit: {
					type: "spring",
					stiffness: 380,
					damping: 35,
					opacity: { duration: .1 }
				}
			},
			style: { overflow: "hidden" },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					padding: "16px 20px",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					display: "grid",
					gridTemplateColumns: "1fr 1fr 1fr",
					gap: 16
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Available",
						value: formatFlow(unstaked),
						accent: "#00ff87"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Staked",
						value: formatFlow(flow.staked),
						accent: "#00c8ff"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "APY",
						value: flow.apy + "%",
						accent: "#ffd553"
					})
				]
			})
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				height: 52,
				padding: "0 20px",
				display: "flex",
				alignItems: "center",
				gap: 4
			},
			children: [
				wallet.connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 8
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s, {
							size: 13,
							color: "rgba(255,255,255,0.35)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 11,
								color: "rgba(255,255,255,0.35)",
								letterSpacing: "0.05em"
							},
							children: "USDC"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono",
							style: {
								fontSize: 13,
								fontWeight: 600,
								color: "#00c8ff"
							},
							children: formatUSDCFull(wallet.usdcBalance)
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					width: 1,
					height: 16,
					background: "rgba(255,255,255,0.08)",
					margin: "0 12px"
				} })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setExpanded((e) => !e),
					style: {
						display: "flex",
						alignItems: "center",
						gap: 8,
						background: "none",
						border: "none",
						cursor: "pointer",
						padding: "4px 8px",
						borderRadius: 6
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(c, {
							size: 13,
							color: "rgba(0,200,255,0.6)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 11,
								color: "rgba(255,255,255,0.35)",
								letterSpacing: "0.05em"
							},
							children: "$FLOW"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono",
							style: {
								fontSize: 13,
								fontWeight: 600,
								color: "rgba(255,255,255,0.85)"
							},
							children: flow.balance.toLocaleString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							width: 1,
							height: 14,
							background: "rgba(255,255,255,0.08)",
							margin: "0 4px"
						} }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 11,
								color: "rgba(255,255,255,0.35)"
							},
							children: "STAKED"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono",
							style: {
								fontSize: 13,
								fontWeight: 500,
								color: "#00c8ff"
							},
							children: flow.staked.toLocaleString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
							animate: { rotate: expanded ? 0 : 180 },
							transition: {
								type: "spring",
								stiffness: 400,
								damping: 25
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$1, {
								size: 13,
								color: "rgba(255,255,255,0.3)"
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					width: 1,
					height: 16,
					background: "rgba(255,255,255,0.08)",
					margin: "0 12px"
				} }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 8
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(c$1, {
							size: 13,
							color: flow.pendingDividends > 0 ? "#ffd553" : "rgba(255,255,255,0.25)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 11,
								color: "rgba(255,255,255,0.35)",
								letterSpacing: "0.05em"
							},
							children: "DIV"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono",
							style: {
								fontSize: 13,
								fontWeight: 600,
								color: flow.pendingDividends > 0 ? "#ffd553" : "rgba(255,255,255,0.35)"
							},
							children: flow.pendingDividends > 0 ? formatUSDCFull(flow.pendingDividends) : "—"
						}),
						flow.pendingDividends > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onClaim,
							disabled: claiming,
							className: "btn-primary",
							style: {
								fontSize: 11,
								padding: "3px 10px",
								marginLeft: 4
							},
							children: claiming ? "..." : "CLAIM"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1 } }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						fontSize: 11,
						color: "rgba(255,255,255,0.25)"
					},
					children: "EARNED ALL-TIME"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mono",
					style: {
						fontSize: 12,
						color: "rgba(255,255,255,0.4)",
						marginLeft: 6
					},
					children: formatUSDCFull(flow.totalEarned)
				})
			]
		})]
	});
}
function Stat({ label, value, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 4
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: {
				fontSize: 11,
				color: "rgba(255,255,255,0.35)",
				letterSpacing: "0.06em"
			},
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mono",
			style: {
				fontSize: 16,
				fontWeight: 600,
				color: accent
			},
			children: value
		})]
	});
}
function WinNotification({ notifications, onDismiss }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			position: "fixed",
			top: 64,
			left: "50%",
			transform: "translateX(-50%)",
			zIndex: 1e3,
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 8,
			pointerEvents: "none",
			width: "100%",
			maxWidth: 420
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
			mode: "popLayout",
			children: notifications.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toast, {
				toast: n,
				onDismiss: () => onDismiss(n.id)
			}, n.id))
		})
	});
}
function Toast({ toast, onDismiss }) {
	(0, import_react.useEffect)(() => {
		const t = setTimeout(onDismiss, 5e3);
		return () => clearTimeout(t);
	}, [onDismiss]);
	const isWin = toast.type === "win";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			transform: "translateY(-60px) scale(0.95)",
			opacity: 0,
			filter: "blur(6px)"
		},
		animate: {
			transform: "translateY(0px) scale(1)",
			opacity: 1,
			filter: "blur(0px)"
		},
		exit: {
			transform: "translateY(-40px) scale(0.97)",
			opacity: 0,
			filter: "blur(4px)"
		},
		transition: {
			type: "spring",
			stiffness: 350,
			damping: 24,
			exit: { duration: .15 }
		},
		onClick: onDismiss,
		className: isWin ? "broadcast-corners" : "",
		style: {
			pointerEvents: "auto",
			cursor: "pointer",
			background: isWin ? "linear-gradient(135deg, rgba(255,213,83,0.14) 0%, rgba(13,13,28,0.97) 60%)" : "linear-gradient(135deg, rgba(0,200,255,0.08) 0%, rgba(13,13,28,0.97) 60%)",
			border: `1px solid ${isWin ? "rgba(255,213,83,0.4)" : "rgba(0,200,255,0.25)"}`,
			borderRadius: 12,
			padding: "14px 20px",
			display: "flex",
			alignItems: "center",
			gap: 14,
			backdropFilter: "blur(20px)",
			boxShadow: isWin ? "0 4px 40px rgba(255,213,83,0.2), 0 0 80px rgba(255,213,83,0.06)" : "0 4px 30px rgba(0,200,255,0.1)",
			minWidth: 340,
			overflow: "visible"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				width: 36,
				height: 36,
				borderRadius: "50%",
				background: isWin ? "rgba(255,213,83,0.15)" : "rgba(0,200,255,0.12)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexShrink: 0,
				boxShadow: isWin ? "0 0 20px rgba(255,213,83,0.15)" : "none"
			},
			children: isWin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$2, {
				size: 18,
				color: "#ffd553",
				weight: "fill"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c, {
				size: 18,
				color: "#00c8ff"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: { flex: 1 },
			children: isWin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-shimmer display",
				style: {
					fontSize: 18,
					fontWeight: 700,
					lineHeight: 1.2,
					letterSpacing: "0.02em"
				},
				children: ["You won $", toast.amount?.toFixed(2)]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					fontSize: 12,
					color: "rgba(255,255,255,0.35)",
					marginTop: 3
				},
				children: toast.option
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "display",
				style: {
					fontSize: 15,
					fontWeight: 600,
					color: "#00c8ff",
					letterSpacing: "0.02em"
				},
				children: [
					"You received ",
					toast.flowReceived?.toLocaleString(),
					" $FLOW"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					fontSize: 12,
					color: "rgba(255,255,255,0.35)",
					marginTop: 3
				},
				children: "Losers become owners — stake to earn"
			})] })
		})]
	});
}
function useWinNotifications() {
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	function push(toast) {
		const id = Math.random().toString(36).slice(2);
		setNotifications((prev) => [...prev, {
			...toast,
			id
		}]);
	}
	function dismiss(id) {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	}
	return {
		notifications,
		push,
		dismiss
	};
}
function VideoPlayer({ streamTitle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			width: "100%",
			height: "100%",
			position: "relative",
			background: "#000"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				style: {
					width: "100%",
					height: "100%",
					objectFit: "cover",
					display: "block",
					background: "#000"
				},
				muted: true,
				autoPlay: true,
				loop: true,
				playsInline: true,
				poster: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%23000'/%3E%3C/svg%3E"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
				position: "absolute",
				inset: 0,
				background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0.45) 100%)",
				pointerEvents: "none"
			} }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "crt-lines" }),
			streamTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					position: "absolute",
					top: 16,
					left: 16,
					display: "flex",
					alignItems: "center",
					gap: 8
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 6,
						background: "rgba(0,0,0,0.6)",
						borderRadius: 6,
						padding: "5px 12px",
						backdropFilter: "blur(8px)",
						border: "1px solid rgba(255,45,120,0.3)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "live-dot",
						style: {
							width: 7,
							height: 7,
							borderRadius: "50%",
							background: "#ff2d78",
							boxShadow: "0 0 8px #ff2d78"
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono",
						style: {
							fontSize: 11,
							fontWeight: 700,
							color: "#ff2d78",
							letterSpacing: "0.12em"
						},
						children: "LIVE"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						background: "rgba(0,0,0,0.5)",
						borderRadius: 6,
						padding: "5px 12px",
						backdropFilter: "blur(8px)",
						border: "1px solid rgba(255,255,255,0.1)"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 12,
							fontWeight: 500,
							color: "rgba(255,255,255,0.7)"
						},
						children: streamTitle
					})
				})]
			})
		]
	});
}
var CARD_W = 340;
var CARD_H = 42;
var DRIFT_SPEED = .3;
var VERTICAL_WOBBLE = .4;
/**
* NikoNiko-style read-only card that drifts across the video area.
* Shows the question + multiplier. Hovering pauses drift and shows full title.
* Clicking opens the vault detail in the right panel.
*/
function NikoNikoCard({ vault, index, total, onClickCard }) {
	const ref = (0, import_react.useRef)(null);
	const posRef = (0, import_react.useRef)({
		x: 0,
		y: 0,
		dx: -.3,
		dy: 0
	});
	const rafRef = (0, import_react.useRef)(0);
	const hoveredRef = (0, import_react.useRef)(false);
	const textRef = (0, import_react.useRef)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [hovered, setHovered] = (0, import_react.useState)(false);
	const [isTruncated, setIsTruncated] = (0, import_react.useState)(false);
	const isHot = vault.status === "hot";
	(0, import_react.useEffect)(() => {
		const parent = ref.current?.parentElement;
		if (!parent) return;
		const pw = parent.clientWidth;
		const ph = parent.clientHeight;
		const baseY = 20 + index * Math.max(58, (ph - 40) / Math.max(total, 1));
		const jitter = (Math.random() - .5) * 20;
		const y = Math.min(Math.max(8, baseY + jitter), ph - CARD_H - 8);
		posRef.current = {
			x: pw * .3 + Math.random() * pw * .6,
			y,
			dx: -(DRIFT_SPEED + Math.random() * .2),
			dy: (Math.random() - .5) * VERTICAL_WOBBLE
		};
		setReady(true);
	}, [index, total]);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		if (!ref.current?.parentElement) return;
		function tick() {
			const el = ref.current;
			const p = el?.parentElement;
			if (!el || !p) return;
			if (!hoveredRef.current) {
				const pw = p.clientWidth;
				const ph = p.clientHeight;
				const pos = posRef.current;
				pos.x += pos.dx;
				pos.y += pos.dy;
				if (pos.x < -350) {
					pos.x = pw + 10;
					pos.y = 20 + index * Math.max(58, (ph - 40) / Math.max(total, 1)) + (Math.random() - .5) * 20;
					pos.y = Math.min(Math.max(8, pos.y), ph - CARD_H - 8);
				}
				if (pos.y < 4 || pos.y > ph - CARD_H - 4) {
					pos.dy = -pos.dy;
					pos.y = Math.min(Math.max(4, pos.y), ph - CARD_H - 4);
				}
			}
			el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
			rafRef.current = requestAnimationFrame(tick);
		}
		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [
		ready,
		index,
		total
	]);
	const accentColor = isHot ? "rgba(255,45,120,0.55)" : "rgba(0,255,135,0.4)";
	const textColor = isHot ? "#ff7a00" : "#00ff87";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		ref,
		initial: {
			opacity: 0,
			filter: "blur(4px)"
		},
		animate: {
			opacity: ready ? 1 : 0,
			filter: ready ? "blur(0px)" : "blur(4px)"
		},
		exit: {
			opacity: 0,
			filter: "blur(4px)"
		},
		transition: {
			duration: .25,
			delay: index * .06
		},
		onClick: () => onClickCard?.(vault.id),
		onMouseEnter: () => {
			hoveredRef.current = true;
			setHovered(true);
			if (textRef.current) setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
		},
		onMouseLeave: () => {
			hoveredRef.current = false;
			setHovered(false);
		},
		style: {
			position: "absolute",
			top: 0,
			left: 0,
			width: CARD_W,
			height: CARD_H,
			background: hovered ? "rgba(13,13,28,0.85)" : "rgba(13,13,28,0.55)",
			backdropFilter: "blur(8px)",
			border: `1px solid ${hovered ? isHot ? "rgba(255,45,120,0.7)" : "rgba(0,255,135,0.6)" : accentColor}`,
			borderRadius: 10,
			padding: "0 14px",
			display: "flex",
			alignItems: "center",
			gap: 10,
			cursor: "pointer",
			pointerEvents: "auto",
			boxShadow: hovered ? `0 0 24px ${accentColor}, 0 4px 16px rgba(0,0,0,0.5)` : `0 0 12px ${accentColor}, 0 2px 8px rgba(0,0,0,0.4)`,
			willChange: "transform",
			zIndex: hovered ? 100 : 15 + index,
			transition: "background 0.15s, border-color 0.15s, box-shadow 0.2s"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				ref: textRef,
				style: {
					fontFamily: "var(--font-display)",
					fontSize: 12,
					fontWeight: 600,
					color: hovered ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)",
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
					flex: 1,
					lineHeight: 1.2,
					letterSpacing: "0.01em",
					transition: "color 0.15s"
				},
				children: vault.option
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					fontFamily: "var(--font-mono)",
					fontSize: 13,
					fontWeight: 700,
					color: textColor,
					flexShrink: 0,
					textShadow: `0 0 12px ${accentColor}`
				},
				children: formatMultiplier(vault.multiplier)
			}),
			hovered && isTruncated && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					position: "absolute",
					bottom: "calc(100% + 8px)",
					left: 12,
					maxWidth: 260,
					background: "rgba(20,20,35,0.96)",
					borderRadius: 6,
					padding: "6px 10px",
					pointerEvents: "none",
					zIndex: 200,
					boxShadow: "0 2px 12px rgba(0,0,0,0.5)"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontFamily: "var(--font-sans)",
						fontSize: 12,
						fontWeight: 500,
						color: "rgba(255,255,255,0.85)",
						lineHeight: 1.4,
						margin: 0,
						whiteSpace: "normal"
					},
					children: vault.option
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					position: "absolute",
					top: "100%",
					left: 16,
					width: 0,
					height: 0,
					borderLeft: "5px solid transparent",
					borderRight: "5px solid transparent",
					borderTop: "5px solid rgba(20,20,35,0.96)"
				} })]
			})
		]
	});
}
var MAX_RATE = 10;
var THUMB_R = 12;
function StreamSlider({ initialSide = null, initialRate = 0, disabled = false, compact = false, onStream }) {
	const trackRef = (0, import_react.useRef)(null);
	const [isDragging, setIsDragging] = (0, import_react.useState)(false);
	const [side, setSide] = (0, import_react.useState)(initialSide);
	const [rate, setRate] = (0, import_react.useState)(initialRate);
	const x = useMotionValue(0);
	const thumbColor = useTransform(x, [
		-120,
		-5,
		5,
		120
	], [
		"#ff2d78",
		"#ff2d78",
		"#00ff87",
		"#00ff87"
	]);
	function getHalfWidth() {
		return Math.max(1, (trackRef.current?.clientWidth ?? 280) / 2 - THUMB_R);
	}
	function updateFromX(xVal) {
		const hw = getHalfWidth(), pct = Math.max(-1, Math.min(1, xVal / hw));
		const newRate = Math.abs(pct) * MAX_RATE;
		const newSide = pct > .05 ? "yes" : pct < -.05 ? "no" : null;
		setRate(newRate);
		setSide(newSide);
		onStream?.(newSide, newRate);
	}
	function handleTrackClick(e) {
		if (disabled) return;
		const track = trackRef.current;
		if (!track) return;
		const rect = track.getBoundingClientRect();
		const clickX = e.clientX - rect.left - rect.width / 2;
		animate(x, clickX, {
			type: "spring",
			stiffness: 500,
			damping: 30
		});
		updateFromX(clickX);
	}
	const rateLabel = rate > .01 ? `$${rate.toFixed(2)}/min` : null;
	const sideColor = side === "yes" ? "#00ff87" : side === "no" ? "#ff2d78" : "rgba(255,255,255,0.2)";
	const trackFills = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
			position: "absolute",
			right: "50%",
			top: 0,
			height: "100%",
			width: "50%",
			background: "linear-gradient(90deg, rgba(255,45,120,0.3), #ff2d78)",
			borderRadius: 2,
			transform: `scaleX(${side === "no" ? rate / MAX_RATE : 0})`,
			transformOrigin: "right",
			transition: "transform 0.05s"
		} }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
			position: "absolute",
			left: "50%",
			top: 0,
			height: "100%",
			width: "50%",
			background: "linear-gradient(90deg, #00ff87, rgba(0,255,135,0.3))",
			borderRadius: 2,
			transform: `scaleX(${side === "yes" ? rate / MAX_RATE : 0})`,
			transformOrigin: "left",
			transition: "transform 0.05s"
		} }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
			drag: disabled ? false : "x",
			dragMomentum: false,
			dragConstraints: trackRef,
			dragElastic: .05,
			style: {
				x,
				position: "absolute",
				top: -10,
				left: `calc(50% - ${THUMB_R}px)`,
				width: THUMB_R * 2,
				height: THUMB_R * 2,
				borderRadius: "50%",
				background: thumbColor,
				border: "2px solid rgba(0,0,0,0.3)",
				boxShadow: isDragging ? `0 0 20px ${sideColor}40` : "0 2px 8px rgba(0,0,0,0.5)",
				cursor: disabled ? "not-allowed" : "grab",
				zIndex: 2,
				touchAction: "none"
			},
			onDrag: () => updateFromX(x.get()),
			onDragStart: () => setIsDragging(true),
			onDragEnd: () => {
				setIsDragging(false);
				if (Math.abs(x.get()) < getHalfWidth() * .05) {
					animate(x, 0, {
						type: "spring",
						stiffness: 500,
						damping: 30
					});
					setSide(null);
					setRate(0);
					onStream?.(null, 0);
				}
			},
			whileTap: { scale: 1.1 }
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
			position: "absolute",
			left: "50%",
			top: -2,
			width: 1,
			height: 8,
			background: "rgba(255,255,255,0.15)",
			transform: "translateX(-50%)",
			pointerEvents: "none"
		} })
	] });
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: { userSelect: "none" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				alignItems: "center",
				gap: 6
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						fontSize: 9,
						fontWeight: 700,
						letterSpacing: "0.06em",
						color: side === "no" ? "#ff2d78" : "rgba(255,255,255,0.2)",
						fontFamily: "var(--font-mono)",
						flexShrink: 0,
						transition: "color 0.2s"
					},
					children: "NO"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: trackRef,
					onClick: handleTrackClick,
					style: {
						position: "relative",
						height: 5,
						background: "rgba(255,255,255,0.07)",
						borderRadius: 2,
						cursor: disabled ? "not-allowed" : "pointer",
						flex: 1
					},
					children: trackFills
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						fontSize: 9,
						fontWeight: 700,
						letterSpacing: "0.06em",
						color: side === "yes" ? "#00ff87" : "rgba(255,255,255,0.2)",
						fontFamily: "var(--font-mono)",
						flexShrink: 0,
						transition: "color 0.2s"
					},
					children: "YES"
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: { userSelect: "none" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				marginBottom: 8
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.08em",
						color: side === "no" ? "#ff2d78" : "rgba(255,255,255,0.25)",
						transition: "color 0.2s",
						fontFamily: "var(--font-mono)"
					},
					children: "NO"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						textAlign: "center",
						minHeight: 16
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						mode: "wait",
						initial: false,
						children: rateLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.span, {
							initial: {
								opacity: 0,
								y: -4,
								filter: "blur(4px)"
							},
							animate: {
								opacity: 1,
								y: 0,
								filter: "blur(0px)"
							},
							exit: {
								opacity: 0,
								y: 4,
								filter: "blur(4px)"
							},
							transition: { duration: .12 },
							style: {
								fontSize: 11,
								fontFamily: "var(--font-mono)",
								fontWeight: 600,
								color: sideColor,
								display: "inline-block"
							},
							children: [
								rateLabel,
								" → ",
								side?.toUpperCase()
							]
						}, "rate") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
							initial: { opacity: 0 },
							animate: { opacity: 1 },
							exit: { opacity: 0 },
							transition: { duration: .1 },
							style: {
								fontSize: 10,
								color: "rgba(255,255,255,0.2)",
								fontFamily: "var(--font-mono)",
								display: "inline-block"
							},
							children: "← drag to stream →"
						}, "idle")
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.08em",
						color: side === "yes" ? "#00ff87" : "rgba(255,255,255,0.25)",
						transition: "color 0.2s",
						fontFamily: "var(--font-mono)"
					},
					children: "YES"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: trackRef,
			onClick: handleTrackClick,
			style: {
				position: "relative",
				height: 5,
				background: "rgba(255,255,255,0.07)",
				borderRadius: 2,
				cursor: disabled ? "not-allowed" : "pointer"
			},
			children: trackFills
		})]
	});
}
function FocusedVault({ vault, onDismiss }) {
	const [hotMs, setHotMs] = (0, import_react.useState)(vault.hotUntil ? Math.max(0, vault.hotUntil - Date.now()) : 0);
	const [expiryMs, setExpiryMs] = (0, import_react.useState)(Math.max(0, vault.expiresAt - Date.now()));
	const [streamSide, setStreamSide] = (0, import_react.useState)(vault.userPosition?.side ?? null);
	const [streamRate, setStreamRate] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (vault.status !== "hot" && vault.status !== "open") return;
		const tick = setInterval(() => {
			if (vault.hotUntil) setHotMs(Math.max(0, vault.hotUntil - Date.now()));
			setExpiryMs(Math.max(0, vault.expiresAt - Date.now()));
		}, 500);
		return () => clearInterval(tick);
	}, [
		vault.hotUntil,
		vault.expiresAt,
		vault.status
	]);
	const poolPct = calcPoolPct(vault.noTotal, vault.yesTotal);
	const isHot = vault.status === "hot";
	const totalPool = vault.noTotal + vault.yesTotal;
	const yesOdds = vault.noTotal > 0 ? totalPool / vault.yesTotal : 0;
	const noOdds = vault.yesTotal > 0 ? totalPool / vault.noTotal : 0;
	const hasPos = !!vault.userPosition;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			transform: "translateY(-12px)",
			filter: "blur(4px)"
		},
		animate: {
			opacity: 1,
			transform: "translateY(0px)",
			filter: "blur(0px)"
		},
		exit: {
			opacity: 0,
			transform: "translateY(-8px)",
			filter: "blur(4px)"
		},
		transition: {
			type: "spring",
			stiffness: 350,
			damping: 28,
			exit: { duration: .15 }
		},
		style: {
			flexShrink: 0,
			borderBottom: "1px solid rgba(255,255,255,0.07)",
			padding: "18px 18px 18px",
			background: isHot ? "linear-gradient(180deg, rgba(255,45,120,0.04) 0%, transparent 100%)" : "linear-gradient(180deg, rgba(0,255,135,0.02) 0%, transparent 100%)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "flex-start",
					gap: 10,
					marginBottom: 16
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						flex: 1,
						minWidth: 0
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "display",
						style: {
							fontSize: 15,
							fontWeight: 600,
							color: "rgba(255,255,255,0.9)",
							lineHeight: 1.35,
							marginBottom: 6,
							letterSpacing: "0.01em"
						},
						children: vault.option
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8
						},
						children: [isHot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 3,
								background: "rgba(255,45,120,0.12)",
								border: "1px solid rgba(255,45,120,0.3)",
								borderRadius: 4,
								padding: "1px 6px"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$3, {
								size: 9,
								color: "#ff2d78"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mono",
								style: {
									fontSize: 9,
									fontWeight: 700,
									color: "#ff2d78"
								},
								children: ["HOT ", formatCountdown(hotMs)]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 3
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n, {
								size: 9,
								color: "rgba(255,255,255,0.3)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mono",
								style: {
									fontSize: 9,
									color: "rgba(255,255,255,0.3)"
								},
								children: formatCountdown(expiryMs)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono",
							style: {
								fontSize: 10,
								color: "rgba(255,255,255,0.2)"
							},
							children: [
								"$",
								totalPool.toFixed(0),
								" pooled"
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onDismiss,
					style: {
						width: 26,
						height: 26,
						borderRadius: 6,
						flexShrink: 0,
						background: "rgba(255,255,255,0.06)",
						border: "1px solid rgba(255,255,255,0.1)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						color: "rgba(255,255,255,0.4)"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$1, { size: 12 })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					gap: 8,
					marginBottom: 16
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						flex: 1,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 2,
						padding: "10px 0",
						borderRadius: 8,
						background: hasPos && vault.userPosition?.side === "yes" ? "rgba(0,255,135,0.1)" : "rgba(0,255,135,0.04)",
						border: `1px solid ${hasPos && vault.userPosition?.side === "yes" ? "rgba(0,255,135,0.3)" : "rgba(0,255,135,0.12)"}`
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono",
						style: {
							fontSize: 18,
							fontWeight: 700,
							color: "#00ff87"
						},
						children: formatMultiplier(yesOdds)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mono",
						style: {
							fontSize: 9,
							letterSpacing: "0.08em",
							color: "rgba(0,255,135,0.6)"
						},
						children: ["YES · $", vault.yesTotal.toFixed(0)]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						flex: 1,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 2,
						padding: "10px 0",
						borderRadius: 8,
						background: hasPos && vault.userPosition?.side === "no" ? "rgba(255,45,120,0.1)" : "rgba(255,45,120,0.04)",
						border: `1px solid ${hasPos && vault.userPosition?.side === "no" ? "rgba(255,45,120,0.3)" : "rgba(255,45,120,0.12)"}`
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono",
						style: {
							fontSize: 18,
							fontWeight: 700,
							color: "#ff2d78"
						},
						children: formatMultiplier(noOdds)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mono",
						style: {
							fontSize: 9,
							letterSpacing: "0.08em",
							color: "rgba(255,45,120,0.6)"
						},
						children: ["NO · $", vault.noTotal.toFixed(0)]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: { marginBottom: 18 },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						height: 3,
						background: "rgba(255,255,255,0.06)",
						borderRadius: 2,
						overflow: "hidden",
						display: "flex"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
						width: `${(1 - poolPct) * 100}%`,
						background: "#ff2d78",
						opacity: .5
					} }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
						width: `${poolPct * 100}%`,
						background: "#00ff87",
						opacity: .5
					} })]
				})
			}),
			hasPos && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 16,
					padding: "6px 10px",
					background: "rgba(255,255,255,0.025)",
					borderRadius: 6,
					border: "1px solid rgba(255,255,255,0.05)"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 9,
							color: "rgba(255,255,255,0.3)",
							letterSpacing: "0.06em"
						},
						children: "YOUR POS"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono",
						style: {
							fontSize: 10,
							fontWeight: 700,
							color: vault.userPosition.side === "yes" ? "#00ff87" : "#ff2d78"
						},
						children: vault.userPosition.side.toUpperCase()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mono",
						style: {
							fontSize: 10,
							color: "rgba(255,255,255,0.4)"
						},
						children: [
							"$",
							vault.userPosition.streamed.toFixed(2),
							" in"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mono",
						style: {
							fontSize: 10,
							color: "rgba(255,255,255,0.4)"
						},
						children: [vault.userPosition.shares, " shares"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreamSlider, {
				vaultId: vault.id,
				initialSide: vault.userPosition?.side ?? null,
				initialRate: vault.userPosition ? .8 : 0,
				onStream: (side, rate) => {
					setStreamSide(side);
					setStreamRate(rate);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				disabled: !streamSide || streamRate < .01,
				style: {
					width: "100%",
					marginTop: 18,
					padding: "12px 0",
					fontSize: 12,
					fontWeight: 700,
					fontFamily: "var(--font-display)",
					letterSpacing: "0.04em",
					borderRadius: 8,
					border: "none",
					cursor: streamSide ? "pointer" : "default",
					background: streamSide === "yes" ? "#00ff87" : streamSide === "no" ? "#ff2d78" : "rgba(255,255,255,0.06)",
					color: streamSide ? "#000" : "rgba(255,255,255,0.25)",
					transition: "background 0.2s, color 0.2s"
				},
				children: !streamSide ? "DRAG TO CHOOSE A SIDE" : hasPos ? `UPDATE STREAM → ${streamSide.toUpperCase()}` : `STREAM → ${streamSide.toUpperCase()}`
			}),
			isHot && vault.exitBurn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					background: "rgba(255,45,120,0.06)",
					border: "1px solid rgba(255,45,120,0.15)",
					borderRadius: 6,
					padding: "5px 10px",
					marginTop: 10
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 4
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$3, {
						size: 11,
						color: "#ff2d78"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 10,
							color: "#ff2d78",
							fontWeight: 600
						},
						children: "EXIT BURN"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mono",
					style: {
						fontSize: 11,
						fontWeight: 700,
						color: "#ff7a00"
					},
					children: [vault.exitBurn, "%"]
				})]
			})
		]
	});
}
var META = {
	alert: {
		icon: c$2,
		color: "#ffd553",
		label: "ALERT"
	},
	vault_created: {
		icon: n$2,
		color: "#00ff87",
		label: "NEW VAULT"
	},
	stream_surge: {
		icon: c$3,
		color: "#00c8ff",
		label: "SURGE"
	},
	hot_period: {
		icon: s$3,
		color: "#ff2d78",
		label: "HOT"
	},
	resolved: {
		icon: s$2,
		color: "#00ff87",
		label: "RESOLVED"
	},
	milestone: {
		icon: s$4,
		color: "#ffd553",
		label: "MILESTONE"
	},
	system: {
		icon: n$3,
		color: "rgba(255,255,255,0.4)",
		label: "SYSTEM"
	}
};
function ActivityFeed({ events }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			height: "100%",
			overflowY: "auto",
			padding: "12px 8px"
		},
		children: [events.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventRow, {
			event: e,
			index: i
		}, e.id)), events.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: "40px 0",
				gap: 10
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$3, {
				size: 24,
				color: "rgba(255,255,255,0.1)"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					fontSize: 13,
					color: "rgba(255,255,255,0.25)"
				},
				children: "Waiting for events..."
			})]
		})]
	});
}
function EventRow({ event, index }) {
	const meta = META[event.t] ?? META["system"];
	const Icon = meta.icon;
	const isHighlight = event.t === "alert" || event.t === "resolved";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			transform: "translateX(-12px)"
		},
		animate: {
			opacity: 1,
			transform: "translateX(0px)"
		},
		transition: {
			delay: index * .04,
			duration: .2
		},
		style: {
			display: "flex",
			gap: 12,
			padding: "10px 10px",
			borderRadius: 8,
			marginBottom: 4,
			background: isHighlight ? "rgba(255,213,83,0.04)" : "transparent",
			border: isHighlight ? "1px solid rgba(255,213,83,0.1)" : "1px solid transparent",
			position: "relative",
			overflow: "hidden"
		},
		children: [
			isHighlight && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
				position: "absolute",
				inset: 0,
				background: "linear-gradient(90deg, rgba(255,213,83,0.06) 0%, transparent 70%)",
				pointerEvents: "none"
			} }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					flexShrink: 0,
					width: 30,
					paddingTop: 2,
					textAlign: "right"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mono",
					style: {
						fontSize: 12,
						fontWeight: 600,
						color: isHighlight ? "#ffd553" : "rgba(255,255,255,0.3)"
					},
					children: [event.min, "'"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					flexShrink: 0,
					width: 28,
					height: 28,
					borderRadius: "50%",
					background: `${meta.color}18`,
					border: `1px solid ${meta.color}30`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginTop: 1
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					size: 13,
					color: meta.color
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { flex: 1 },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 8,
						marginBottom: 3
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "display",
						style: {
							fontSize: 10,
							fontWeight: 700,
							letterSpacing: "0.08em",
							color: meta.color
						},
						children: meta.label
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontSize: 12,
						color: isHighlight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
						lineHeight: 1.4,
						fontWeight: isHighlight ? 500 : 400
					},
					children: event.desc
				})]
			})
		]
	});
}
function MyPositions({ positions, vaults, onSelectVault }) {
	const active = positions.filter((p) => !p.resolved);
	const resolved = positions.filter((p) => p.resolved);
	const totalStreamed = positions.reduce((s, p) => s + p.streamed, 0);
	const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			height: "100%",
			overflowY: "auto",
			padding: "14px 10px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "1fr 1fr 1fr",
					gap: 8,
					marginBottom: 20,
					padding: "0 2px"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						label: "ACTIVE",
						value: active.length.toString(),
						accent: "#00ff87"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						label: "STREAMED",
						value: formatUSDC(totalStreamed)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						label: "P&L",
						value: (totalPnl >= 0 ? "+" : "") + formatUSDC(totalPnl),
						accent: totalPnl >= 0 ? "#00ff87" : "#ff2d78"
					})
				]
			}),
			active.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { marginBottom: 20 },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Active Streams" }), active.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivePositionRow, {
					position: p,
					index: i,
					onSelectVault
				}, p.vaultId + i))]
			}),
			resolved.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Resolved" }), resolved.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResolvedRow, {
				position: p,
				index: i
			}, p.vaultId + i))] }),
			positions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: 160,
					gap: 10
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(i, {
					size: 28,
					color: "rgba(255,255,255,0.1)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					style: {
						fontSize: 13,
						color: "rgba(255,255,255,0.25)",
						textAlign: "center"
					},
					children: [
						"No streams yet.",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"Tap a prediction on the video to start."
					]
				})]
			})
		]
	});
}
function ActivePositionRow({ position: p, index = 0, onSelectVault }) {
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [paused, setPaused] = (0, import_react.useState)(false);
	const [liveRate, setLiveRate] = (0, import_react.useState)(null);
	const pos = p.pnl >= 0;
	const displayRate = liveRate?.rate ?? p.streamRate;
	const displaySide = liveRate?.side ?? p.side;
	const streaming = displayRate > 0 && !paused;
	const relockTimer = (0, import_react.useRef)(null);
	const insideRef = (0, import_react.useRef)(false);
	const startRelock = (0, import_react.useCallback)(() => {
		if (relockTimer.current) clearTimeout(relockTimer.current);
		if (editing && !insideRef.current) relockTimer.current = setTimeout(() => setEditing(false), 1e4);
	}, [editing]);
	(0, import_react.useEffect)(() => {
		if (!editing) {
			if (relockTimer.current) clearTimeout(relockTimer.current);
			return;
		}
		startRelock();
		return () => {
			if (relockTimer.current) clearTimeout(relockTimer.current);
		};
	}, [editing, startRelock]);
	const handlePointerEnter = (0, import_react.useCallback)(() => {
		insideRef.current = true;
		if (relockTimer.current) clearTimeout(relockTimer.current);
	}, []);
	const handlePointerLeave = (0, import_react.useCallback)(() => {
		insideRef.current = false;
		startRelock();
	}, [startRelock]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			transform: "translateY(6px)",
			filter: "blur(4px)"
		},
		animate: {
			opacity: 1,
			transform: "translateY(0px)",
			filter: "blur(0px)"
		},
		transition: {
			type: "spring",
			stiffness: 320,
			damping: 30,
			delay: index * .04
		},
		style: {
			background: "rgba(255,255,255,0.025)",
			border: `1px solid ${streaming ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.06)"}`,
			borderRadius: 12,
			padding: "14px 16px",
			marginBottom: 10,
			transition: "border-color 0.2s cubic-bezier(0.23, 1, 0.32, 1)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: 8
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						flex: 1,
						minWidth: 0
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onSelectVault(p.vaultId),
						style: {
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: 0,
							textAlign: "left",
							fontSize: 13,
							color: "rgba(255,255,255,0.75)",
							fontWeight: 500,
							fontFamily: "var(--font-sans)",
							marginBottom: 6,
							display: "block",
							lineHeight: 1.4
						},
						children: p.option
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 6,
							flexWrap: "wrap"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 10,
									fontFamily: "var(--font-mono)",
									fontWeight: 700,
									color: displaySide === "yes" ? "#00ff87" : displaySide === "no" ? "#ff2d78" : "rgba(255,255,255,0.3)",
									background: displaySide === "yes" ? "rgba(0,255,135,0.1)" : displaySide === "no" ? "rgba(255,45,120,0.1)" : "rgba(255,255,255,0.05)",
									padding: "2px 7px",
									borderRadius: 4,
									transition: "color 0.15s, background 0.15s"
								},
								children: displaySide?.toUpperCase() ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								style: {
									fontSize: 10,
									color: "rgba(255,255,255,0.25)"
								},
								children: [p.minute, "'"]
							}),
							streaming && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 3,
									fontSize: 10,
									fontFamily: "var(--font-mono)",
									fontWeight: 600,
									color: editing ? "#00c8ff" : "#00ff87",
									transition: "color 0.15s"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "live-dot",
									style: {
										width: 4,
										height: 4,
										borderRadius: "50%",
										background: editing ? "#00c8ff" : "#00ff87"
									}
								}), formatRate(displayRate)]
							}),
							paused && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 9,
									fontFamily: "var(--font-mono)",
									color: "rgba(255,255,255,0.3)",
									background: "rgba(255,255,255,0.05)",
									padding: "1px 5px",
									borderRadius: 3
								},
								children: "PAUSED"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						textAlign: "right",
						flexShrink: 0,
						paddingLeft: 12
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 4,
							justifyContent: "flex-end"
						},
						children: [pos ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c, {
							size: 12,
							color: "#00ff87"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$5, {
							size: 12,
							color: "#ff2d78"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono",
							style: {
								fontSize: 14,
								fontWeight: 700,
								color: pos ? "#00ff87" : "#ff2d78"
							},
							children: [pos ? "+" : "", formatUSDC(p.pnl)]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono",
						style: {
							fontSize: 10,
							color: "rgba(255,255,255,0.25)",
							marginTop: 3
						},
						children: [
							formatUSDC(p.streamed),
							" in · ",
							formatUSDC(p.currentValue),
							" val · ",
							p.shares,
							" sh"
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
				width: "50%",
				height: 1,
				background: "rgba(255,255,255,0.04)",
				margin: "6px auto 0"
			} }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "stretch",
					gap: 6,
					paddingTop: 14
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setPaused((v) => !v),
					style: {
						width: 36,
						flexShrink: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: 6,
						background: paused ? "rgba(0,255,135,0.08)" : "rgba(255,255,255,0.04)",
						border: `1px solid ${paused ? "rgba(0,255,135,0.2)" : "rgba(255,255,255,0.08)"}`,
						cursor: "pointer",
						color: paused ? "#00ff87" : "rgba(255,255,255,0.35)",
						transition: "all 0.15s cubic-bezier(0.23, 1, 0.32, 1)"
					},
					children: paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$4, {
						size: 12,
						weight: "fill"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$5, {
						size: 12,
						weight: "fill"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onPointerEnter: handlePointerEnter,
					onPointerLeave: handlePointerLeave,
					style: {
						flex: 1,
						minWidth: 0,
						position: "relative",
						display: "flex",
						alignItems: "center",
						minHeight: 36
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							flex: 1,
							padding: "0 4px"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreamSlider, {
							vaultId: p.vaultId,
							initialSide: p.side,
							initialRate: p.streamRate,
							disabled: !editing,
							compact: true,
							onStream: (side, rate) => setLiveRate({
								side,
								rate
							})
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: !editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
						exit: { opacity: 0 },
						transition: { duration: .12 },
						onClick: () => setEditing(true),
						style: {
							position: "absolute",
							inset: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: "rgba(13,13,28,0.8)",
							backdropFilter: "blur(1px)",
							borderRadius: 6,
							border: "1px solid rgba(255,255,255,0.08)",
							cursor: "pointer",
							fontSize: 10,
							fontWeight: 600,
							fontFamily: "var(--font-mono)",
							letterSpacing: "0.06em",
							color: "rgba(255,255,255,0.4)",
							zIndex: 3
						},
						children: "ADJUST RATE"
					}, "adjust-overlay") })]
				})]
			})
		]
	});
}
function ResolvedRow({ position: p, index = 0 }) {
	const pos = p.pnl >= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			transform: "translateY(6px)",
			filter: "blur(4px)"
		},
		animate: {
			opacity: 1,
			transform: "translateY(0px)",
			filter: "blur(0px)"
		},
		transition: {
			type: "spring",
			stiffness: 320,
			damping: 30,
			delay: index * .04
		},
		style: {
			background: "rgba(255,255,255,0.015)",
			border: "1px solid rgba(255,255,255,0.04)",
			borderRadius: 10,
			padding: "12px 14px",
			marginBottom: 8,
			opacity: .75
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					flex: 1,
					minWidth: 0
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontSize: 12,
						color: "rgba(255,255,255,0.5)",
						fontWeight: 400,
						marginBottom: 4
					},
					children: p.option
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 6
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 10,
								fontFamily: "var(--font-mono)",
								fontWeight: 700,
								color: p.side === "yes" ? "rgba(0,255,135,0.6)" : "rgba(255,45,120,0.6)",
								background: p.side === "yes" ? "rgba(0,255,135,0.06)" : "rgba(255,45,120,0.06)",
								padding: "2px 6px",
								borderRadius: 4
							},
							children: p.side.toUpperCase()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 10,
								fontFamily: "var(--font-mono)",
								color: p.won ? "#ffd553" : "rgba(255,255,255,0.3)",
								background: p.won ? "rgba(255,213,83,0.1)" : "rgba(255,255,255,0.04)",
								padding: "2px 6px",
								borderRadius: 4
							},
							children: p.won ? "WON" : "LOST"
						}),
						p.won && p.payout && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono",
							style: {
								fontSize: 10,
								color: "#ffd553"
							},
							children: ["+", formatUSDC(p.payout)]
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					textAlign: "right",
					flexShrink: 0,
					paddingLeft: 12
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 4,
						justifyContent: "flex-end"
					},
					children: [pos ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c, {
						size: 11,
						color: "rgba(0,255,135,0.6)"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$5, {
						size: 11,
						color: "rgba(255,45,120,0.6)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mono",
						style: {
							fontSize: 12,
							fontWeight: 600,
							color: pos ? "rgba(0,255,135,0.7)" : "rgba(255,45,120,0.7)"
						},
						children: [pos ? "+" : "", formatUSDC(p.pnl)]
					})]
				})
			})]
		})
	});
}
function SummaryCard({ label, value, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			background: "rgba(255,255,255,0.03)",
			border: "1px solid rgba(255,255,255,0.06)",
			borderRadius: 8,
			padding: "10px 12px"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				fontSize: 9,
				color: "rgba(255,255,255,0.3)",
				letterSpacing: "0.08em",
				marginBottom: 5
			},
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mono",
			style: {
				fontSize: 14,
				fontWeight: 700,
				color: accent ?? "rgba(255,255,255,0.8)"
			},
			children: value
		})]
	});
}
function SectionLabel({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			fontSize: 10,
			fontFamily: "var(--font-mono)",
			fontWeight: 600,
			letterSpacing: "0.1em",
			color: "rgba(255,255,255,0.25)",
			padding: "4px 4px 10px"
		},
		children
	});
}
function VaultList({ vaults, events, positions, selectedVaultId, onDismissVault }) {
	const [tab, setTab] = (0, import_react.useState)("feed");
	const selectedVault = selectedVaultId ? vaults.find((v) => v.id === selectedVaultId) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			height: "100%",
			overflow: "hidden"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: selectedVault && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FocusedVault, {
				vault: selectedVault,
				onDismiss: onDismissVault
			}, "focused-vault") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					borderBottom: "1px solid rgba(255,255,255,0.07)",
					padding: "0 16px",
					flexShrink: 0,
					gap: 4
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
					active: tab === "feed",
					onClick: () => setTab("feed"),
					children: "LIVE FEED"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
					active: tab === "mine",
					onClick: () => setTab("mine"),
					count: positions.filter((p) => !p.resolved).length,
					children: "STREAMS"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					flex: 1,
					overflow: "hidden",
					position: "relative"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AnimatePresence, {
					mode: "wait",
					children: [tab === "feed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						initial: {
							opacity: 0,
							transform: "translateX(8px)"
						},
						animate: {
							opacity: 1,
							transform: "translateX(0px)"
						},
						exit: {
							opacity: 0,
							transform: "translateX(-8px)"
						},
						transition: {
							duration: .15,
							exit: { duration: .1 }
						},
						style: {
							height: "100%",
							overflow: "hidden"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityFeed, { events })
					}, "feed"), tab === "mine" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						initial: {
							opacity: 0,
							transform: "translateX(8px)"
						},
						animate: {
							opacity: 1,
							transform: "translateX(0px)"
						},
						exit: {
							opacity: 0,
							transform: "translateX(-8px)"
						},
						transition: {
							duration: .15,
							exit: { duration: .1 }
						},
						style: {
							height: "100%",
							overflow: "hidden"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MyPositions, {
							positions,
							vaults,
							onSelectVault: (id) => {}
						})
					}, "mine")]
				})
			})
		]
	});
}
function TabBtn({ active, onClick, children, count }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		style: {
			background: "none",
			border: "none",
			cursor: "pointer",
			padding: "10px 12px 11px",
			fontSize: 11,
			fontWeight: 700,
			letterSpacing: "0.1em",
			fontFamily: "var(--font-mono)",
			color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
			position: "relative",
			display: "flex",
			alignItems: "center",
			gap: 6,
			transition: "color 0.15s cubic-bezier(0.23, 1, 0.32, 1)"
		},
		children: [
			children,
			count !== void 0 && count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: 16,
					height: 16,
					borderRadius: "50%",
					background: active ? "#00ff87" : "rgba(255,255,255,0.1)",
					color: active ? "#000" : "rgba(255,255,255,0.5)",
					fontSize: 10,
					fontWeight: 700
				},
				children: count
			}),
			active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				layoutId: "vault-tab-indicator",
				style: {
					position: "absolute",
					bottom: -1,
					left: 0,
					right: 0,
					height: 2,
					background: "var(--color-green)",
					borderRadius: 1,
					boxShadow: "0 0 8px var(--color-green-glow)"
				},
				transition: {
					type: "spring",
					stiffness: 400,
					damping: 30
				}
			})
		]
	});
}
function useVaults() {
	const [vaults, setVaults] = (0, import_react.useState)(mockVaults);
	(0, import_react.useEffect)(() => {
		const interval = setInterval(() => {
			setVaults((prev) => prev.map((v) => {
				if (v.status !== "open" && v.status !== "hot") return v;
				const drift = (Math.random() - .48) * .04;
				return {
					...v,
					noTotal: Math.max(10, v.noTotal + Math.random() * 4),
					yesTotal: Math.max(10, v.yesTotal + Math.random() * 2.5),
					multiplier: Math.max(1.05, +(v.multiplier + drift).toFixed(3))
				};
			}));
		}, 2200);
		return () => clearInterval(interval);
	}, []);
	return vaults;
}
function useWebSocket(url = "ws://localhost:8765") {
	const [frame, setFrame] = (0, import_react.useState)(mockFrame);
	const [events, setEvents] = (0, import_react.useState)(mockEvents);
	const [connected, setConnected] = (0, import_react.useState)(false);
	const wsRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (connected) return;
		const interval = setInterval(() => {
			setFrame((prev) => ({
				...prev,
				frame: prev.frame + 1,
				ts: Date.now()
			}));
		}, 800);
		return () => clearInterval(interval);
	}, [connected]);
	(0, import_react.useEffect)(() => {
		try {
			const ws = new WebSocket(url);
			ws.onopen = () => setConnected(true);
			ws.onmessage = (e) => {
				try {
					const data = JSON.parse(e.data);
					setFrame(data);
					if (data.events?.length) setEvents((prev) => [...data.events, ...prev].slice(0, 50));
				} catch {}
			};
			ws.onclose = () => setConnected(false);
			ws.onerror = () => ws.close();
			wsRef.current = ws;
		} catch {}
		return () => wsRef.current?.close();
	}, [url]);
	return {
		frame,
		events,
		connected
	};
}
function useFlow() {
	const [flow, setFlow] = (0, import_react.useState)(mockFlow);
	const [claiming, setClaiming] = (0, import_react.useState)(false);
	function stake(amount) {
		if (amount <= 0 || amount > flow.balance - flow.staked) return;
		setFlow((prev) => ({
			...prev,
			staked: prev.staked + amount
		}));
	}
	function unstake(amount) {
		if (amount <= 0 || amount > flow.staked) return;
		setFlow((prev) => ({
			...prev,
			staked: prev.staked - amount
		}));
	}
	function claimDividends() {
		if (flow.pendingDividends <= 0) return;
		setClaiming(true);
		setTimeout(() => {
			setFlow((prev) => ({
				...prev,
				totalEarned: prev.totalEarned + prev.pendingDividends,
				pendingDividends: 0
			}));
			setClaiming(false);
		}, 1200);
	}
	return {
		flow,
		stake,
		unstake,
		claimDividends,
		claiming
	};
}
function StreamLayout({ streamTitle, category, totalPooled }) {
	const vaults = useVaults();
	const { frame, events } = useWebSocket();
	const { legacyWallet } = useWalletContext();
	const { flow, stake, unstake, claimDividends, claiming } = useFlow();
	const { notifications, push, dismiss } = useWinNotifications();
	const [selectedVaultId, setSelectedVaultId] = (0, import_react.useState)(null);
	const floatingVaults = vaults.filter((v) => v.status === "open" || v.status === "hot");
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => push({
			type: "win",
			amount: 26.98,
			option: "Panel reaches consensus on AI safety"
		}), 4e3);
		return () => clearTimeout(t);
	}, []);
	const handleNikoClick = (0, import_react.useCallback)((vaultId) => {
		setSelectedVaultId((prev) => prev === vaultId ? null : vaultId);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			height: "100vh",
			background: "var(--color-bg)",
			position: "relative",
			overflow: "hidden"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "grid-bg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0 20px",
					height: 48,
					borderBottom: "1px solid rgba(255,255,255,0.055)",
					background: "rgba(7,7,15,0.95)",
					backdropFilter: "blur(20px)",
					flexShrink: 0,
					zIndex: 30,
					position: "relative"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 10
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							style: {
								display: "flex",
								alignItems: "center",
								gap: 10,
								textDecoration: "none"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									width: 26,
									height: 26,
									borderRadius: 7,
									background: "linear-gradient(135deg, #00ff87, #00c8ff)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 13,
										fontWeight: 800,
										color: "#000",
										fontFamily: "var(--font-display)"
									},
									children: "F"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "display",
								style: {
									fontSize: 15,
									fontWeight: 700,
									color: "rgba(255,255,255,0.9)",
									letterSpacing: "0.02em"
								},
								children: "FlowStream"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 9,
								fontFamily: "var(--font-mono)",
								color: "rgba(255,255,255,0.3)",
								border: "1px solid rgba(255,255,255,0.1)",
								borderRadius: 4,
								padding: "1px 5px"
							},
							children: "ALPHA"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							width: 1,
							height: 16,
							background: "rgba(255,255,255,0.08)",
							margin: "0 4px"
						} }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 10,
								fontWeight: 600,
								color: getCategoryColor(category),
								background: `${getCategoryColor(category)}12`,
								border: `1px solid ${getCategoryColor(category)}25`,
								padding: "2px 8px",
								borderRadius: 4,
								fontFamily: "var(--font-mono)"
							},
							children: category
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConnectButton, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreamBar, {
				frame,
				streamTitle,
				totalPooled
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stream-split",
				style: {
					flex: 1,
					display: "flex",
					position: "relative",
					zIndex: 1,
					overflow: "hidden"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stream-video-pane",
					style: {
						flex: "3 1 60%",
						minWidth: 0,
						position: "relative",
						borderRight: "1px solid rgba(255,255,255,0.06)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPlayer, { streamTitle }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							position: "absolute",
							inset: 0,
							pointerEvents: "none",
							overflow: "hidden",
							zIndex: 10
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: floatingVaults.map((vault, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NikoNikoCard, {
							vault,
							index: i,
							total: floatingVaults.length,
							onClickCard: handleNikoClick
						}, vault.id)) })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stream-predictions-pane",
					style: {
						flex: "2 1 40%",
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
						background: "rgba(7,7,15,0.98)",
						overflow: "hidden"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultList, {
						vaults,
						events,
						positions: mockPositions,
						selectedVaultId,
						onDismissVault: () => setSelectedVaultId(null)
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BalanceBar, {
				flow,
				wallet: legacyWallet,
				onStake: stake,
				onUnstake: unstake,
				onClaim: claimDividends,
				claiming
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinNotification, {
				notifications,
				onDismiss: dismiss
			})
		]
	});
}
function getCategoryColor(category) {
	return {
		Tech: "#00ff87",
		Esports: "#00c8ff",
		Politics: "#ff7a00",
		Entertainment: "#ffd553"
	}[category] ?? "#00ff87";
}
function StreamPage() {
	const { id } = Route.useParams();
	const stream = mockStreams.find((s) => s.id === id) ?? mockStreams[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreamLayout, {
		streamTitle: stream.title,
		category: stream.category,
		totalPooled: stream.totalPooled
	});
}
//#endregion
export { StreamPage as component };
