import { c as lazyRouteComponent, d as Link, f as require_jsx_runtime, i as useRouterState, l as createFileRoute, n as Scripts, o as createRouter, r as HeadContent, s as Outlet, u as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as MotionConfig } from "../_libs/framer-motion.mjs";
import { n as Route$3, r as WalletProvider, t as ConnectButton } from "../_id-DcSZ1Gxn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-l_WWu4bt.js
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-pTp5IpRL.css";
var Route$2 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "FlowStream" }
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap"
			}
		]
	}),
	component: RootComponent,
	shellComponent: RootDocument
});
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("body", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MotionConfig, {
			reducedMotion: "user",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "noise-overlay" }),
				children,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		}) })]
	});
}
var navLinks = [{
	to: "/",
	label: "Home"
}, {
	to: "/agents",
	label: "Agents"
}];
function RootComponent() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	if (pathname.startsWith("/stream/")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			minHeight: "100vh",
			background: "var(--color-bg)",
			position: "relative"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "grid-bg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0 24px",
					height: 56,
					borderBottom: "1px solid rgba(255,255,255,0.055)",
					background: "rgba(7,7,15,0.95)",
					backdropFilter: "blur(20px)",
					flexShrink: 0,
					zIndex: 30,
					position: "sticky",
					top: 0
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 28
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						style: {
							display: "flex",
							alignItems: "center",
							gap: 10,
							textDecoration: "none"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									width: 28,
									height: 28,
									borderRadius: 7,
									background: "linear-gradient(135deg, #00ff87, #00c8ff)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 14,
										fontWeight: 800,
										color: "#000",
										fontFamily: "var(--font-display)"
									},
									children: "F"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "display",
								style: {
									fontSize: 16,
									fontWeight: 700,
									color: "rgba(255,255,255,0.9)",
									letterSpacing: "0.02em"
								},
								children: "FlowStream"
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
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 4
						},
						children: navLinks.map((link) => {
							const isActive = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: link.to,
								style: {
									padding: "6px 14px",
									borderRadius: 6,
									fontSize: 13,
									fontWeight: 500,
									color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
									background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
									textDecoration: "none",
									transition: "background 0.15s, color 0.15s",
									fontFamily: "var(--font-sans)"
								},
								children: link.label
							}, link.to);
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConnectButton, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				style: {
					flex: 1,
					position: "relative",
					zIndex: 1
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
			})
		]
	}) });
}
var $$splitComponentImporter$1 = () => import("./agents-BM0wU0vI.mjs");
var Route$1 = createFileRoute("/agents")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./routes-VNjOTA-w.mjs");
var Route = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var AgentsRoute = Route$1.update({
	id: "/agents",
	path: "/agents",
	getParentRoute: () => Route$2
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$2
	}),
	AgentsRoute,
	StreamIdRoute: Route$3.update({
		id: "/stream/$id",
		path: "/stream/$id",
		getParentRoute: () => Route$2
	})
};
var routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0
	});
}
//#endregion
export { getRouter };
