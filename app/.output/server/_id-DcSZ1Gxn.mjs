import { o as __toESM } from "./_runtime.mjs";
import { s as formatUSDCFull, v as mockWallet } from "./_ssr/format-D011AXfE.mjs";
import { E as s$2, P as require_react, b as n$2, d as m, f as c$1, i as s, j as s$1, k as n$3, n, o as n$1, r as c } from "./_libs/phosphor-icons__react+react.mjs";
import { c as lazyRouteComponent, f as require_jsx_runtime, l as createFileRoute } from "./_libs/@tanstack/react-router+[...].mjs";
import { i as motion, o as AnimatePresence } from "./_libs/framer-motion.mjs";
import { a as toWebAuthnCredential, i as toPasskeyTransport, n as toCircleSmartAccount, r as toModularTransport, t as WebAuthnMode, v as erc20Abi } from "./_libs/@circle-fin/modular-wallets-core.mjs";
import { i as defineChain, n as toWebAuthnAccount, r as createPublicClient, t as createBundlerClient } from "./_libs/viem.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id-DcSZ1Gxn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var arcTestnet = defineChain({
	id: 5042002,
	name: "Arc Testnet",
	nativeCurrency: {
		name: "USDC",
		symbol: "USDC",
		decimals: 18
	},
	rpcUrls: { default: {
		http: ["https://rpc.testnet.arc.network"],
		webSocket: ["wss://rpc.testnet.arc.network"]
	} },
	blockExplorers: { default: {
		name: "ArcScan",
		url: "https://testnet.arcscan.app"
	} },
	testnet: true
});
var USDC_ARC = "0x3600000000000000000000000000000000000000";
var CREDENTIAL_STORAGE_KEY = "flowstream_circle_credential";
var clientKey = "93a60a89d8bfe0453b72b2a992e63ad5:438f5db9565a1fc8c73723e8e479905f";
var clientUrl = "https://modular-sdk.circle.com/v1/rpc/w3s/buidl";
function storeCredential(credential) {
	try {
		const data = {
			id: credential.id,
			publicKey: credential.publicKey
		};
		localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(data));
	} catch {}
}
function loadStoredCredential() {
	try {
		const raw = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function clearStoredCredential() {
	try {
		localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
	} catch {}
}
function useCircleWallet() {
	const [address, setAddress] = (0, import_react.useState)(null);
	const [isConnected, setIsConnected] = (0, import_react.useState)(false);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [usdcBalance, setUsdcBalance] = (0, import_react.useState)(0n);
	const bundlerClientRef = (0, import_react.useRef)(null);
	const publicClientRef = (0, import_react.useRef)(null);
	const balanceIntervalRef = (0, import_react.useRef)(null);
	const initializeFromCredential = (0, import_react.useCallback)(async (credential) => {
		const modularTransport = toModularTransport(`${clientUrl}/arcTestnet`, clientKey);
		const publicClient = createPublicClient({
			chain: arcTestnet,
			transport: modularTransport
		});
		publicClientRef.current = publicClient;
		const smartAccount = await toCircleSmartAccount({
			client: publicClient,
			owner: toWebAuthnAccount({ credential })
		});
		bundlerClientRef.current = createBundlerClient({
			account: smartAccount,
			chain: arcTestnet,
			transport: modularTransport,
			paymaster: true
		});
		const accountAddress = smartAccount.address;
		setAddress(accountAddress);
		setIsConnected(true);
		setError(null);
		fetchBalance(publicClient, accountAddress);
		if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);
		balanceIntervalRef.current = setInterval(() => {
			fetchBalance(publicClient, accountAddress);
		}, 15e3);
		return accountAddress;
	}, []);
	const fetchBalance = (0, import_react.useCallback)(async (client, addr) => {
		try {
			setUsdcBalance(await client.readContract({
				address: USDC_ARC,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [addr]
			}));
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		const stored = loadStoredCredential();
		if (stored) {
			setIsLoading(true);
			initializeFromCredential(stored).catch(() => {
				clearStoredCredential();
			}).finally(() => setIsLoading(false));
		}
		return () => {
			if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);
		};
	}, [initializeFromCredential]);
	return {
		address,
		isConnected,
		isLoading,
		error,
		usdcBalance,
		register: (0, import_react.useCallback)(async (username) => {
			setIsLoading(true);
			setError(null);
			try {
				const credential = await toWebAuthnCredential({
					transport: toPasskeyTransport(clientUrl, clientKey),
					mode: WebAuthnMode.Register,
					username
				});
				storeCredential(credential);
				await initializeFromCredential(credential);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Registration failed";
				if (message.includes("InvalidStateError")) setError("A passkey already exists for this account. Try logging in instead.");
				else if (message.includes("NotAllowedError") || message.includes("cancelled")) setError("Passkey creation was cancelled.");
				else setError(message);
				throw err;
			} finally {
				setIsLoading(false);
			}
		}, [initializeFromCredential]),
		login: (0, import_react.useCallback)(async () => {
			setIsLoading(true);
			setError(null);
			try {
				const credential = await toWebAuthnCredential({
					transport: toPasskeyTransport(clientUrl, clientKey),
					mode: WebAuthnMode.Login
				});
				storeCredential(credential);
				await initializeFromCredential(credential);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Login failed";
				if (message.includes("NotAllowedError") || message.includes("cancelled")) setError("Passkey selection was cancelled.");
				else setError(message);
				throw err;
			} finally {
				setIsLoading(false);
			}
		}, [initializeFromCredential]),
		disconnect: (0, import_react.useCallback)(() => {
			clearStoredCredential();
			setAddress(null);
			setIsConnected(false);
			setUsdcBalance(0n);
			setError(null);
			bundlerClientRef.current = null;
			publicClientRef.current = null;
			if (balanceIntervalRef.current) {
				clearInterval(balanceIntervalRef.current);
				balanceIntervalRef.current = null;
			}
		}, []),
		sendUserOperation: (0, import_react.useCallback)(async (calls) => {
			const bundler = bundlerClientRef.current;
			if (!bundler) throw new Error("Wallet not connected");
			const userOpHash = await bundler.sendUserOperation({
				calls,
				paymaster: true
			});
			const { receipt } = await bundler.waitForUserOperationReceipt({ hash: userOpHash });
			if (publicClientRef.current && address) fetchBalance(publicClientRef.current, address);
			return receipt.transactionHash;
		}, [address, fetchBalance])
	};
}
var WalletContext = (0, import_react.createContext)(null);
function WalletProvider({ children }) {
	const circle = useCircleWallet();
	const legacyWallet = (0, import_react.useMemo)(() => ({
		address: circle.address ? `${circle.address.slice(0, 6)}...${circle.address.slice(-4)}` : mockWallet.address,
		usdcBalance: circle.isConnected ? Number(circle.usdcBalance) / 1e6 : mockWallet.usdcBalance,
		connected: circle.isConnected,
		sessionKeySigned: circle.isConnected
	}), [
		circle.address,
		circle.isConnected,
		circle.usdcBalance
	]);
	const value = (0, import_react.useMemo)(() => ({
		address: circle.address,
		isConnected: circle.isConnected,
		isLoading: circle.isLoading,
		error: circle.error,
		usdcBalance: circle.usdcBalance,
		register: circle.register,
		login: circle.login,
		disconnect: circle.disconnect,
		sendUserOperation: circle.sendUserOperation,
		legacyWallet
	}), [circle, legacyWallet]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletContext.Provider, {
		value,
		children
	});
}
function useWalletContext() {
	const ctx = (0, import_react.useContext)(WalletContext);
	if (!ctx) throw new Error("useWalletContext must be used within <WalletProvider>");
	return ctx;
}
var iconSwap = {
	initial: {
		opacity: 0,
		scale: .8,
		filter: "blur(4px)"
	},
	animate: {
		opacity: 1,
		scale: 1,
		filter: "blur(0px)"
	},
	exit: {
		opacity: 0,
		scale: .8,
		filter: "blur(4px)"
	},
	transition: { duration: .15 }
};
function ConnectButton() {
	const { address, isConnected, isLoading, error, legacyWallet, register, login, disconnect } = useWalletContext();
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [modalOpen, setModalOpen] = (0, import_react.useState)(false);
	const [modalMode, setModalMode] = (0, import_react.useState)("choose");
	const [username, setUsername] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)(false);
	function copyAddress() {
		if (address) navigator.clipboard.writeText(address).catch(() => null);
		setCopied(true);
		setTimeout(() => setCopied(false), 2e3);
	}
	function openModal() {
		setModalMode("choose");
		setUsername("");
		setModalOpen(true);
	}
	function closeModal() {
		setModalOpen(false);
		setUsername("");
	}
	async function handleRegister() {
		if (!username.trim()) return;
		try {
			await register(username.trim());
			closeModal();
		} catch {}
	}
	async function handleLogin() {
		try {
			await login();
			closeModal();
		} catch {}
	}
	const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
	if (!isConnected) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: openModal,
		disabled: isLoading,
		style: {
			display: "flex",
			alignItems: "center",
			gap: 8,
			background: "rgba(0,255,135,0.1)",
			border: "1px solid rgba(0,255,135,0.3)",
			borderRadius: 8,
			padding: "8px 14px",
			cursor: isLoading ? "wait" : "pointer",
			color: "#00ff87",
			fontSize: 13,
			fontWeight: 600,
			fontFamily: "var(--font-sans)",
			opacity: isLoading ? .6 : 1,
			transition: "opacity 0.15s"
		},
		children: [isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
			animate: { rotate: 360 },
			transition: {
				repeat: Infinity,
				duration: .8,
				ease: "linear"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m, { size: 14 })
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s, { size: 14 }), isLoading ? "Connecting..." : "Connect"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: modalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		onClick: closeModal,
		style: {
			position: "fixed",
			inset: 0,
			background: "rgba(0,0,0,0.7)",
			backdropFilter: "blur(4px)",
			zIndex: 200
		}
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			transform: "translate(-50%, -50%) scale(0.95)",
			filter: "blur(4px)"
		},
		animate: {
			opacity: 1,
			transform: "translate(-50%, -50%) scale(1)",
			filter: "blur(0px)"
		},
		exit: {
			opacity: 0,
			transform: "translate(-50%, -50%) scale(0.97)",
			filter: "blur(2px)"
		},
		transition: {
			type: "spring",
			stiffness: 350,
			damping: 28,
			exit: { duration: .15 }
		},
		className: "broadcast-corners",
		style: {
			position: "fixed",
			top: "50%",
			left: "50%",
			zIndex: 201,
			background: "#0d0d1c",
			border: "1px solid rgba(0,255,135,0.2)",
			borderRadius: 16,
			padding: 28,
			width: 380,
			boxShadow: "0 0 60px rgba(0,255,135,0.08), 0 24px 80px rgba(0,0,0,0.8)",
			overflow: "visible"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: closeModal,
				style: {
					position: "absolute",
					top: 16,
					right: 16,
					background: "none",
					border: "none",
					cursor: "pointer",
					color: "rgba(255,255,255,0.3)",
					padding: 4
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n, { size: 16 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					width: 48,
					height: 48,
					borderRadius: 12,
					background: "rgba(0,255,135,0.1)",
					border: "1px solid rgba(0,255,135,0.2)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 20
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s, {
					size: 22,
					color: "#00ff87"
				})
			}),
			modalMode === "choose" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display",
					style: {
						fontSize: 20,
						fontWeight: 700,
						marginBottom: 10,
						color: "#fff",
						letterSpacing: "0.02em"
					},
					children: "Connect Wallet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontSize: 14,
						color: "rgba(255,255,255,0.5)",
						lineHeight: 1.6,
						marginBottom: 24
					},
					children: "Use a passkey to create or access your smart wallet. No extensions, no seed phrases."
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "flex-start",
						gap: 8,
						background: "rgba(255,45,120,0.08)",
						border: "1px solid rgba(255,45,120,0.2)",
						borderRadius: 8,
						padding: "10px 12px",
						marginBottom: 16
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(c, {
						size: 14,
						color: "#ff2d78",
						style: {
							marginTop: 1,
							flexShrink: 0
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 12,
							color: "#ff2d78",
							lineHeight: 1.4
						},
						children: error
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setModalMode("register"),
					disabled: isLoading,
					style: {
						display: "flex",
						alignItems: "center",
						gap: 12,
						width: "100%",
						padding: "14px 16px",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: 10,
						cursor: "pointer",
						marginBottom: 10,
						transition: "background 0.15s, border-color 0.15s",
						textAlign: "left"
					},
					onMouseEnter: (e) => {
						e.currentTarget.style.background = "rgba(0,255,135,0.06)";
						e.currentTarget.style.borderColor = "rgba(0,255,135,0.2)";
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.background = "rgba(255,255,255,0.04)";
						e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							width: 36,
							height: 36,
							borderRadius: 8,
							background: "rgba(0,255,135,0.1)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$1, {
							size: 16,
							color: "#00ff87"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 14,
							fontWeight: 600,
							color: "#fff",
							fontFamily: "var(--font-sans)",
							marginBottom: 2
						},
						children: "Create Wallet"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 11,
							color: "rgba(255,255,255,0.35)"
						},
						children: "New passkey + smart account"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleLogin,
					disabled: isLoading,
					style: {
						display: "flex",
						alignItems: "center",
						gap: 12,
						width: "100%",
						padding: "14px 16px",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: 10,
						cursor: isLoading ? "wait" : "pointer",
						transition: "background 0.15s, border-color 0.15s",
						textAlign: "left"
					},
					onMouseEnter: (e) => {
						e.currentTarget.style.background = "rgba(0,200,255,0.06)";
						e.currentTarget.style.borderColor = "rgba(0,200,255,0.2)";
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.background = "rgba(255,255,255,0.04)";
						e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							width: 36,
							height: 36,
							borderRadius: 8,
							background: "rgba(0,200,255,0.1)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$2, {
							size: 16,
							color: "#00c8ff"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 14,
							fontWeight: 600,
							color: "#fff",
							fontFamily: "var(--font-sans)",
							marginBottom: 2
						},
						children: "I have a wallet"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 11,
							color: "rgba(255,255,255,0.35)"
						},
						children: "Sign in with existing passkey"
					})] })]
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display",
					style: {
						fontSize: 20,
						fontWeight: 700,
						marginBottom: 10,
						color: "#fff",
						letterSpacing: "0.02em"
					},
					children: "Create Wallet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontSize: 14,
						color: "rgba(255,255,255,0.5)",
						lineHeight: 1.6,
						marginBottom: 20
					},
					children: "Choose a username for your passkey. This is stored locally to identify your credential."
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "flex-start",
						gap: 8,
						background: "rgba(255,45,120,0.08)",
						border: "1px solid rgba(255,45,120,0.2)",
						borderRadius: 8,
						padding: "10px 12px",
						marginBottom: 16
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(c, {
						size: 14,
						color: "#ff2d78",
						style: {
							marginTop: 1,
							flexShrink: 0
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 12,
							color: "#ff2d78",
							lineHeight: 1.4
						},
						children: error
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "Username or email",
					value: username,
					onChange: (e) => setUsername(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter") handleRegister();
					},
					autoFocus: true,
					style: {
						width: "100%",
						padding: "12px 14px",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: 8,
						fontSize: 14,
						color: "#fff",
						fontFamily: "var(--font-sans)",
						outline: "none",
						marginBottom: 16,
						transition: "border-color 0.15s",
						boxSizing: "border-box"
					},
					onFocus: (e) => {
						e.currentTarget.style.borderColor = "rgba(0,255,135,0.4)";
					},
					onBlur: (e) => {
						e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 10
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setModalMode("choose"),
						style: {
							flex: 1,
							padding: "12px 0",
							fontSize: 13,
							borderRadius: 8,
							border: "1px solid rgba(255,255,255,0.1)",
							background: "none",
							color: "rgba(255,255,255,0.5)",
							cursor: "pointer",
							fontFamily: "var(--font-sans)",
							fontWeight: 500
						},
						children: "Back"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleRegister,
						disabled: isLoading || !username.trim(),
						className: "btn-primary",
						style: {
							flex: 2,
							padding: "12px 0",
							fontSize: 13,
							borderRadius: 8,
							fontWeight: 600,
							opacity: isLoading || !username.trim() ? .5 : 1,
							cursor: isLoading || !username.trim() ? "not-allowed" : "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8
						},
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
							animate: { rotate: 360 },
							transition: {
								repeat: Infinity,
								duration: .8,
								ease: "linear"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m, { size: 14 })
						}), "Creating..."] }) : "Create with Passkey"
					})]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				style: {
					fontSize: 11,
					color: "rgba(255,255,255,0.2)",
					textAlign: "center",
					marginTop: 16
				},
				children: "Powered by Circle · Gasless on Arc"
			})
		]
	})] }) })] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: { position: "relative" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setMenuOpen((o) => !o),
			style: {
				display: "flex",
				alignItems: "center",
				gap: 8,
				background: "rgba(255,255,255,0.05)",
				border: "1px solid rgba(255,255,255,0.1)",
				borderRadius: 8,
				padding: "8px 12px",
				cursor: "pointer",
				color: "rgba(255,255,255,0.85)",
				fontSize: 13,
				fontFamily: "var(--font-sans)"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: "#00ff87",
					boxShadow: "0 0 6px #00ff87"
				} }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						fontFamily: "var(--font-mono)",
						fontSize: 12,
						fontWeight: 500
					},
					children: truncatedAddress
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					width: 1,
					height: 14,
					background: "rgba(255,255,255,0.1)"
				} }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mono",
					style: {
						fontSize: 12,
						color: "#00c8ff"
					},
					children: formatUSDCFull(legacyWallet.usdcBalance)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$1, {
					size: 12,
					color: "rgba(255,255,255,0.35)"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: menuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				position: "fixed",
				inset: 0,
				zIndex: 49
			},
			onClick: () => setMenuOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			initial: {
				opacity: 0,
				transform: "translateY(-8px) scale(0.96)"
			},
			animate: {
				opacity: 1,
				transform: "translateY(0px) scale(1)"
			},
			exit: {
				opacity: 0,
				transform: "translateY(-6px) scale(0.97)"
			},
			transition: {
				type: "spring",
				stiffness: 400,
				damping: 28,
				exit: { duration: .12 }
			},
			style: {
				position: "absolute",
				top: "calc(100% + 8px)",
				right: 0,
				background: "#12122a",
				border: "1px solid rgba(255,255,255,0.1)",
				borderRadius: 10,
				padding: 6,
				minWidth: 200,
				zIndex: 50,
				boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
				transformOrigin: "top right"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MenuItem, {
					onClick: copyAddress,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						mode: "wait",
						initial: false,
						children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
							...iconSwap,
							style: { display: "flex" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n$3, {
								size: 13,
								color: "#00ff87"
							})
						}, "check") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
							...iconSwap,
							style: { display: "flex" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s$2, { size: 13 })
						}, "copy")
					}), copied ? "Copied!" : "Copy address"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					height: 1,
					background: "rgba(255,255,255,0.06)",
					margin: "4px 0"
				} }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MenuItem, {
					onClick: () => {
						disconnect();
						setMenuOpen(false);
					},
					danger: true,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(c$1, { size: 13 }), "Disconnect"]
				})
			]
		})] }) })]
	});
}
function MenuItem({ onClick, children, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		style: {
			display: "flex",
			alignItems: "center",
			gap: 8,
			width: "100%",
			padding: "8px 10px",
			background: "none",
			border: "none",
			borderRadius: 6,
			cursor: "pointer",
			fontSize: 13,
			color: danger ? "#ff2d78" : "rgba(255,255,255,0.7)",
			fontFamily: "var(--font-sans)",
			textAlign: "left",
			transition: "background 0.12s cubic-bezier(0.23, 1, 0.32, 1)"
		},
		onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)",
		onMouseLeave: (e) => e.currentTarget.style.background = "none",
		children
	});
}
var $$splitComponentImporter = () => import("./_id--Pr3Ktz0.mjs");
var Route = createFileRoute("/stream/$id")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
//#endregion
export { useWalletContext as i, Route as n, WalletProvider as r, ConnectButton as t };
