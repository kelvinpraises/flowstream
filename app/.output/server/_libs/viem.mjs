import { r as __exportAll } from "../_runtime.mjs";
import { A as ContractFunctionRevertedError, B as parseAccount, C as isAddressEqual, D as serializeStateOverride, E as estimateFeesPerGas, F as prettyPrint, G as pad, H as concat, I as formatGwei, J as getAction, K as BaseError, L as stringify, M as getAbortError, N as getUrl, O as HttpRequestError, P as isAbortError, R as decodeErrorResult, S as formatLog, T as getTransactionCount, U as numberToHex, V as encodeAbiParameters, W as hexToBigInt, _ as call, c as toHex, d as localBatchGatewayRequest, g as observe, h as poll, j as ContractFunctionZeroDataError, k as ContractFunctionExecutionError, l as hashTypedData, m as formatTransactionReceipt, p as createClient, q as isHex, s as publicActions, u as hashMessage, w as getChainId, z as encodeFunctionData } from "./@circle-fin/modular-wallets-core.mjs";
import { t as sign } from "./ox.mjs";
//#region node_modules/viem/_esm/errors/account.js
var AccountNotFoundError = class extends BaseError {
	constructor({ docsPath } = {}) {
		super(["Could not find an Account to execute with this Action.", "Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the Client."].join("\n"), {
			docsPath,
			docsSlug: "account",
			name: "AccountNotFoundError"
		});
	}
};
//#endregion
//#region node_modules/viem/_esm/errors/ccip.js
var OffchainLookupError = class extends BaseError {
	constructor({ callbackSelector, cause, data, extraData, sender, urls }) {
		super(cause.shortMessage || "An error occurred while fetching for an offchain result.", {
			cause,
			metaMessages: [
				...cause.metaMessages || [],
				cause.metaMessages?.length ? "" : [],
				"Offchain Gateway Call:",
				urls && ["  Gateway URL(s):", ...urls.map((url) => `    ${getUrl(url)}`)],
				`  Sender: ${sender}`,
				`  Data: ${data}`,
				`  Callback selector: ${callbackSelector}`,
				`  Extra data: ${extraData}`
			].flat(),
			name: "OffchainLookupError"
		});
	}
};
var OffchainLookupResponseMalformedError = class extends BaseError {
	constructor({ result, url }) {
		super("Offchain gateway response is malformed. Response data must be a hex value.", {
			metaMessages: [`Gateway URL: ${getUrl(url)}`, `Response: ${stringify(result)}`],
			name: "OffchainLookupResponseMalformedError"
		});
	}
};
var OffchainLookupSenderMismatchError = class extends BaseError {
	constructor({ sender, to }) {
		super("Reverted sender address does not match target contract address (`to`).", {
			metaMessages: [`Contract address: ${to}`, `OffchainLookup sender address: ${sender}`],
			name: "OffchainLookupSenderMismatchError"
		});
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/ccip.js
var ccip_exports = /* @__PURE__ */ __exportAll({
	ccipRequest: () => ccipRequest,
	offchainLookup: () => offchainLookup,
	offchainLookupAbiItem: () => offchainLookupAbiItem,
	offchainLookupSignature: () => offchainLookupSignature
});
var offchainLookupSignature = "0x556f1830";
var offchainLookupAbiItem = {
	name: "OffchainLookup",
	type: "error",
	inputs: [
		{
			name: "sender",
			type: "address"
		},
		{
			name: "urls",
			type: "string[]"
		},
		{
			name: "callData",
			type: "bytes"
		},
		{
			name: "callbackFunction",
			type: "bytes4"
		},
		{
			name: "extraData",
			type: "bytes"
		}
	]
};
async function offchainLookup(client, { blockNumber, blockTag, data, requestOptions, to }) {
	const { args } = decodeErrorResult({
		data,
		abi: [offchainLookupAbiItem]
	});
	const [sender, urls, callData, callbackSelector, extraData] = args;
	const { ccipRead } = client;
	const ccipRequest_ = ccipRead && typeof ccipRead?.request === "function" ? ccipRead.request : ccipRequest;
	try {
		if (!isAddressEqual(to, sender)) throw new OffchainLookupSenderMismatchError({
			sender,
			to
		});
		const { data: data_ } = await call(client, {
			blockNumber,
			blockTag,
			data: concat([callbackSelector, encodeAbiParameters([{ type: "bytes" }, { type: "bytes" }], [urls.includes("x-batch-gateway:true") ? await localBatchGatewayRequest({
				data: callData,
				ccipRequest: (parameters) => ccipRequest_({
					...parameters,
					requestOptions
				})
			}) : await ccipRequest_({
				data: callData,
				requestOptions,
				sender,
				urls
			}), extraData])]),
			requestOptions,
			to
		});
		return data_;
	} catch (err) {
		if (requestOptions?.signal?.aborted) throw getAbortError(requestOptions.signal);
		if (isAbortError(err)) throw err;
		throw new OffchainLookupError({
			callbackSelector,
			cause: err,
			data,
			extraData,
			sender,
			urls
		});
	}
}
async function ccipRequest({ data, requestOptions, sender, urls }) {
	let error = /* @__PURE__ */ new Error("An unknown error occurred.");
	for (let i = 0; i < urls.length; i++) {
		if (requestOptions?.signal?.aborted) throw getAbortError(requestOptions.signal);
		const url = urls[i];
		const method = url.includes("{data}") ? "GET" : "POST";
		const body = method === "POST" ? {
			data,
			sender
		} : void 0;
		const headers = method === "POST" ? { "Content-Type": "application/json" } : {};
		try {
			const response = await fetch(url.replace("{sender}", sender.toLowerCase()).replace("{data}", data), {
				body: JSON.stringify(body),
				headers,
				method,
				...requestOptions?.signal ? { signal: requestOptions.signal } : {}
			});
			let result;
			if (response.headers.get("Content-Type")?.startsWith("application/json")) result = (await response.json()).data;
			else result = await response.text();
			if (!response.ok) {
				error = new HttpRequestError({
					body,
					details: result?.error ? stringify(result.error) : response.statusText,
					headers: response.headers,
					status: response.status,
					url
				});
				continue;
			}
			if (!isHex(result)) {
				error = new OffchainLookupResponseMalformedError({
					result,
					url
				});
				continue;
			}
			return result;
		} catch (err) {
			if (requestOptions?.signal?.aborted) throw getAbortError(requestOptions.signal);
			if (isAbortError(err)) throw err;
			error = new HttpRequestError({
				body,
				details: err.message,
				url
			});
		}
	}
	throw error;
}
//#endregion
//#region node_modules/viem/_esm/utils/chain/defineChain.js
function defineChain(chain) {
	const chainInstance = {
		formatters: void 0,
		fees: void 0,
		serializers: void 0,
		...chain
	};
	function extend(base) {
		return (fnOrExtended) => {
			const properties = typeof fnOrExtended === "function" ? fnOrExtended(base) : fnOrExtended;
			const combined = {
				...base,
				...properties
			};
			return Object.assign(combined, { extend: extend(combined) });
		};
	}
	return Object.assign(chainInstance, { extend: extend(chainInstance) });
}
//#endregion
//#region node_modules/viem/_esm/clients/createPublicClient.js
/**
* Creates a Public Client with a given [Transport](https://viem.sh/docs/clients/intro) configured for a [Chain](https://viem.sh/docs/clients/chains).
*
* - Docs: https://viem.sh/docs/clients/public
*
* A Public Client is an interface to "public" [JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/) methods such as retrieving block numbers, transactions, reading from smart contracts, etc through [Public Actions](/docs/actions/public/introduction).
*
* @param config - {@link PublicClientConfig}
* @returns A Public Client. {@link PublicClient}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
*/
function createPublicClient(parameters) {
	const { key = "public", name = "Public Client" } = parameters;
	return createClient({
		...parameters,
		key,
		name,
		type: "publicClient"
	}).extend(publicActions);
}
//#endregion
//#region node_modules/viem/_esm/actions/wallet/prepareAuthorization.js
/**
* Prepares an [EIP-7702 Authorization](https://eips.ethereum.org/EIPS/eip-7702) object for signing.
* This Action will fill the required fields of the Authorization object if they are not provided (e.g. `nonce` and `chainId`).
*
* With the prepared Authorization object, you can use [`signAuthorization`](https://viem.sh/docs/eip7702/signAuthorization) to sign over the Authorization object.
*
* @param client - Client to use
* @param parameters - {@link PrepareAuthorizationParameters}
* @returns The prepared Authorization object. {@link PrepareAuthorizationReturnType}
*
* @example
* import { createClient, http } from 'viem'
* import { privateKeyToAccount } from 'viem/accounts'
* import { mainnet } from 'viem/chains'
* import { prepareAuthorization } from 'viem/experimental'
*
* const client = createClient({
*   chain: mainnet,
*   transport: http(),
* })
* const authorization = await prepareAuthorization(client, {
*   account: privateKeyToAccount('0x..'),
*   contractAddress: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
* })
*
* @example
* // Account Hoisting
* import { createClient, http } from 'viem'
* import { privateKeyToAccount } from 'viem/accounts'
* import { mainnet } from 'viem/chains'
* import { prepareAuthorization } from 'viem/experimental'
*
* const client = createClient({
*   account: privateKeyToAccount('0x…'),
*   chain: mainnet,
*   transport: http(),
* })
* const authorization = await prepareAuthorization(client, {
*   contractAddress: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
* })
*/
async function prepareAuthorization(client, parameters) {
	const { account: account_ = client.account, chainId, nonce } = parameters;
	if (!account_) throw new AccountNotFoundError({ docsPath: "/docs/eip7702/prepareAuthorization" });
	const account = parseAccount(account_);
	const executor = (() => {
		if (!parameters.executor) return void 0;
		if (parameters.executor === "self") return parameters.executor;
		return parseAccount(parameters.executor);
	})();
	const authorization = {
		address: parameters.contractAddress ?? parameters.address,
		chainId,
		nonce
	};
	if (typeof authorization.chainId === "undefined") authorization.chainId = client.chain?.id ?? await getAction(client, getChainId, "getChainId")({});
	if (typeof authorization.nonce === "undefined") {
		authorization.nonce = await getAction(client, getTransactionCount, "getTransactionCount")({
			address: account.address,
			blockTag: "pending"
		});
		if (executor === "self" || executor?.address && isAddressEqual(executor.address, account.address)) authorization.nonce += 1;
	}
	return authorization;
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/accounts/toWebAuthnAccount.js
/**
* @description Creates an Account from a WebAuthn Credential.
*
* @returns A WebAuthn Account.
*/
function toWebAuthnAccount(parameters) {
	const { getFn, rpId } = parameters;
	const { id, publicKey } = parameters.credential;
	return {
		id,
		publicKey,
		async sign({ hash }) {
			const { metadata, raw, signature } = await sign({
				credentialId: id,
				getFn,
				challenge: hash,
				rpId
			});
			return {
				signature: toHex(signature),
				raw,
				webauthn: metadata
			};
		},
		async signMessage({ message }) {
			return this.sign({ hash: hashMessage(message) });
		},
		async signTypedData(parameters) {
			return this.sign({ hash: hashTypedData(parameters) });
		},
		type: "webAuthn"
	};
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/errors/bundler.js
var AccountNotDeployedError = class extends BaseError {
	constructor({ cause }) {
		super("Smart Account is not deployed.", {
			cause,
			metaMessages: [
				"This could arise when:",
				"- No `factory`/`factoryData` or `initCode` properties are provided for Smart Account deployment.",
				"- An incorrect `sender` address is provided."
			],
			name: "AccountNotDeployedError"
		});
	}
};
Object.defineProperty(AccountNotDeployedError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa20/
});
var ExecutionRevertedError = class extends BaseError {
	constructor({ cause, data, message } = {}) {
		const reason = message?.replace("execution reverted: ", "")?.replace("execution reverted", "");
		super(`Execution reverted ${reason ? `with reason: ${reason}` : "for an unknown reason"}.`, {
			cause,
			name: "ExecutionRevertedError"
		});
		Object.defineProperty(this, "data", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.data = data;
	}
};
Object.defineProperty(ExecutionRevertedError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32521
});
Object.defineProperty(ExecutionRevertedError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /execution reverted/
});
var FailedToSendToBeneficiaryError = class extends BaseError {
	constructor({ cause }) {
		super("Failed to send funds to beneficiary.", {
			cause,
			name: "FailedToSendToBeneficiaryError"
		});
	}
};
Object.defineProperty(FailedToSendToBeneficiaryError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa91/
});
var GasValuesOverflowError = class extends BaseError {
	constructor({ cause }) {
		super("Gas value overflowed.", {
			cause,
			metaMessages: ["This could arise when:", "- one of the gas values exceeded 2**120 (uint120)"].filter(Boolean),
			name: "GasValuesOverflowError"
		});
	}
};
Object.defineProperty(GasValuesOverflowError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa94/
});
var HandleOpsOutOfGasError = class extends BaseError {
	constructor({ cause }) {
		super("The `handleOps` function was called by the Bundler with a gas limit too low.", {
			cause,
			name: "HandleOpsOutOfGasError"
		});
	}
};
Object.defineProperty(HandleOpsOutOfGasError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa95/
});
var InitCodeFailedError = class extends BaseError {
	constructor({ cause, factory, factoryData, initCode }) {
		super("Failed to simulate deployment for Smart Account.", {
			cause,
			metaMessages: [
				"This could arise when:",
				"- Invalid `factory`/`factoryData` or `initCode` properties are present",
				"- Smart Account deployment execution ran out of gas (low `verificationGasLimit` value)",
				"- Smart Account deployment execution reverted with an error\n",
				factory && `factory: ${factory}`,
				factoryData && `factoryData: ${factoryData}`,
				initCode && `initCode: ${initCode}`
			].filter(Boolean),
			name: "InitCodeFailedError"
		});
	}
};
Object.defineProperty(InitCodeFailedError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa13/
});
var InitCodeMustCreateSenderError = class extends BaseError {
	constructor({ cause, factory, factoryData, initCode }) {
		super("Smart Account initialization implementation did not create an account.", {
			cause,
			metaMessages: [
				"This could arise when:",
				"- `factory`/`factoryData` or `initCode` properties are invalid",
				"- Smart Account initialization implementation is incorrect\n",
				factory && `factory: ${factory}`,
				factoryData && `factoryData: ${factoryData}`,
				initCode && `initCode: ${initCode}`
			].filter(Boolean),
			name: "InitCodeMustCreateSenderError"
		});
	}
};
Object.defineProperty(InitCodeMustCreateSenderError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa15/
});
var InitCodeMustReturnSenderError = class extends BaseError {
	constructor({ cause, factory, factoryData, initCode, sender }) {
		super("Smart Account initialization implementation does not return the expected sender.", {
			cause,
			metaMessages: [
				"This could arise when:",
				"Smart Account initialization implementation does not return a sender address\n",
				factory && `factory: ${factory}`,
				factoryData && `factoryData: ${factoryData}`,
				initCode && `initCode: ${initCode}`,
				sender && `sender: ${sender}`
			].filter(Boolean),
			name: "InitCodeMustReturnSenderError"
		});
	}
};
Object.defineProperty(InitCodeMustReturnSenderError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa14/
});
var InsufficientPrefundError = class extends BaseError {
	constructor({ cause }) {
		super("Smart Account does not have sufficient funds to execute the User Operation.", {
			cause,
			metaMessages: [
				"This could arise when:",
				"- the Smart Account does not have sufficient funds to cover the required prefund, or",
				"- a Paymaster was not provided"
			].filter(Boolean),
			name: "InsufficientPrefundError"
		});
	}
};
Object.defineProperty(InsufficientPrefundError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa21/
});
var InternalCallOnlyError = class extends BaseError {
	constructor({ cause }) {
		super("Bundler attempted to call an invalid function on the EntryPoint.", {
			cause,
			name: "InternalCallOnlyError"
		});
	}
};
Object.defineProperty(InternalCallOnlyError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa92/
});
var InvalidAggregatorError = class extends BaseError {
	constructor({ cause }) {
		super("Bundler used an invalid aggregator for handling aggregated User Operations.", {
			cause,
			name: "InvalidAggregatorError"
		});
	}
};
Object.defineProperty(InvalidAggregatorError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa96/
});
var InvalidAccountNonceError = class extends BaseError {
	constructor({ cause, nonce }) {
		super("Invalid Smart Account nonce used for User Operation.", {
			cause,
			metaMessages: [nonce && `nonce: ${nonce}`].filter(Boolean),
			name: "InvalidAccountNonceError"
		});
	}
};
Object.defineProperty(InvalidAccountNonceError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa25/
});
var InvalidBeneficiaryError = class extends BaseError {
	constructor({ cause }) {
		super("Bundler has not set a beneficiary address.", {
			cause,
			name: "InvalidBeneficiaryError"
		});
	}
};
Object.defineProperty(InvalidBeneficiaryError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa90/
});
var InvalidFieldsError = class extends BaseError {
	constructor({ cause }) {
		super("Invalid fields set on User Operation.", {
			cause,
			name: "InvalidFieldsError"
		});
	}
};
Object.defineProperty(InvalidFieldsError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32602
});
var InvalidPaymasterAndDataError = class extends BaseError {
	constructor({ cause, paymasterAndData }) {
		super("Paymaster properties provided are invalid.", {
			cause,
			metaMessages: [
				"This could arise when:",
				"- the `paymasterAndData` property is of an incorrect length\n",
				paymasterAndData && `paymasterAndData: ${paymasterAndData}`
			].filter(Boolean),
			name: "InvalidPaymasterAndDataError"
		});
	}
};
Object.defineProperty(InvalidPaymasterAndDataError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa93/
});
var PaymasterDepositTooLowError = class extends BaseError {
	constructor({ cause }) {
		super("Paymaster deposit for the User Operation is too low.", {
			cause,
			metaMessages: ["This could arise when:", "- the Paymaster has deposited less than the expected amount via the `deposit` function"].filter(Boolean),
			name: "PaymasterDepositTooLowError"
		});
	}
};
Object.defineProperty(PaymasterDepositTooLowError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32508
});
Object.defineProperty(PaymasterDepositTooLowError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa31/
});
var PaymasterFunctionRevertedError = class extends BaseError {
	constructor({ cause }) {
		super("The `validatePaymasterUserOp` function on the Paymaster reverted.", {
			cause,
			name: "PaymasterFunctionRevertedError"
		});
	}
};
Object.defineProperty(PaymasterFunctionRevertedError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa33/
});
var PaymasterNotDeployedError = class extends BaseError {
	constructor({ cause }) {
		super("The Paymaster contract has not been deployed.", {
			cause,
			name: "PaymasterNotDeployedError"
		});
	}
};
Object.defineProperty(PaymasterNotDeployedError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa30/
});
var PaymasterRateLimitError = class extends BaseError {
	constructor({ cause }) {
		super("UserOperation rejected because paymaster (or signature aggregator) is throttled/banned.", {
			cause,
			name: "PaymasterRateLimitError"
		});
	}
};
Object.defineProperty(PaymasterRateLimitError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32504
});
var PaymasterStakeTooLowError = class extends BaseError {
	constructor({ cause }) {
		super("UserOperation rejected because paymaster (or signature aggregator) stake or unstake-delay is too low.", {
			cause,
			name: "PaymasterStakeTooLowError"
		});
	}
};
Object.defineProperty(PaymasterStakeTooLowError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32505
});
var PaymasterPostOpFunctionRevertedError = class extends BaseError {
	constructor({ cause }) {
		super("Paymaster `postOp` function reverted.", {
			cause,
			name: "PaymasterPostOpFunctionRevertedError"
		});
	}
};
Object.defineProperty(PaymasterPostOpFunctionRevertedError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa50/
});
var SenderAlreadyConstructedError = class extends BaseError {
	constructor({ cause, factory, factoryData, initCode }) {
		super("Smart Account has already been deployed.", {
			cause,
			metaMessages: [
				"Remove the following properties and try again:",
				factory && "`factory`",
				factoryData && "`factoryData`",
				initCode && "`initCode`"
			].filter(Boolean),
			name: "SenderAlreadyConstructedError"
		});
	}
};
Object.defineProperty(SenderAlreadyConstructedError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa10/
});
var SignatureCheckFailedError = class extends BaseError {
	constructor({ cause }) {
		super("UserOperation rejected because account signature check failed (or paymaster signature, if the paymaster uses its data as signature).", {
			cause,
			name: "SignatureCheckFailedError"
		});
	}
};
Object.defineProperty(SignatureCheckFailedError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32507
});
var SmartAccountFunctionRevertedError = class extends BaseError {
	constructor({ cause }) {
		super("The `validateUserOp` function on the Smart Account reverted.", {
			cause,
			name: "SmartAccountFunctionRevertedError"
		});
	}
};
Object.defineProperty(SmartAccountFunctionRevertedError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa23/
});
var UnsupportedSignatureAggregatorError = class extends BaseError {
	constructor({ cause }) {
		super("UserOperation rejected because account specified unsupported signature aggregator.", {
			cause,
			name: "UnsupportedSignatureAggregatorError"
		});
	}
};
Object.defineProperty(UnsupportedSignatureAggregatorError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32506
});
var UserOperationExpiredError = class extends BaseError {
	constructor({ cause }) {
		super("User Operation expired.", {
			cause,
			metaMessages: ["This could arise when:", "- the `validAfter` or `validUntil` values returned from `validateUserOp` on the Smart Account are not satisfied"].filter(Boolean),
			name: "UserOperationExpiredError"
		});
	}
};
Object.defineProperty(UserOperationExpiredError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa22/
});
var UserOperationPaymasterExpiredError = class extends BaseError {
	constructor({ cause }) {
		super("Paymaster for User Operation expired.", {
			cause,
			metaMessages: ["This could arise when:", "- the `validAfter` or `validUntil` values returned from `validatePaymasterUserOp` on the Paymaster are not satisfied"].filter(Boolean),
			name: "UserOperationPaymasterExpiredError"
		});
	}
};
Object.defineProperty(UserOperationPaymasterExpiredError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa32/
});
var UserOperationSignatureError = class extends BaseError {
	constructor({ cause }) {
		super("Signature provided for the User Operation is invalid.", {
			cause,
			metaMessages: ["This could arise when:", "- the `signature` for the User Operation is incorrectly computed, and unable to be verified by the Smart Account"].filter(Boolean),
			name: "UserOperationSignatureError"
		});
	}
};
Object.defineProperty(UserOperationSignatureError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa24/
});
var UserOperationPaymasterSignatureError = class extends BaseError {
	constructor({ cause }) {
		super("Signature provided for the User Operation is invalid.", {
			cause,
			metaMessages: ["This could arise when:", "- the `signature` for the User Operation is incorrectly computed, and unable to be verified by the Paymaster"].filter(Boolean),
			name: "UserOperationPaymasterSignatureError"
		});
	}
};
Object.defineProperty(UserOperationPaymasterSignatureError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa34/
});
var UserOperationRejectedByEntryPointError = class extends BaseError {
	constructor({ cause }) {
		super("User Operation rejected by EntryPoint's `simulateValidation` during account creation or validation.", {
			cause,
			name: "UserOperationRejectedByEntryPointError"
		});
	}
};
Object.defineProperty(UserOperationRejectedByEntryPointError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32500
});
var UserOperationRejectedByPaymasterError = class extends BaseError {
	constructor({ cause }) {
		super("User Operation rejected by Paymaster's `validatePaymasterUserOp`.", {
			cause,
			name: "UserOperationRejectedByPaymasterError"
		});
	}
};
Object.defineProperty(UserOperationRejectedByPaymasterError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32501
});
var UserOperationRejectedByOpCodeError = class extends BaseError {
	constructor({ cause }) {
		super("User Operation rejected with op code validation error.", {
			cause,
			name: "UserOperationRejectedByOpCodeError"
		});
	}
};
Object.defineProperty(UserOperationRejectedByOpCodeError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32502
});
var UserOperationOutOfTimeRangeError = class extends BaseError {
	constructor({ cause }) {
		super("UserOperation out of time-range: either wallet or paymaster returned a time-range, and it is already expired (or will expire soon).", {
			cause,
			name: "UserOperationOutOfTimeRangeError"
		});
	}
};
Object.defineProperty(UserOperationOutOfTimeRangeError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32503
});
var UnknownBundlerError = class extends BaseError {
	constructor({ cause }) {
		super(`An error occurred while executing user operation: ${cause?.shortMessage}`, {
			cause,
			name: "UnknownBundlerError"
		});
	}
};
var VerificationGasLimitExceededError = class extends BaseError {
	constructor({ cause }) {
		super("User Operation verification gas limit exceeded.", {
			cause,
			metaMessages: ["This could arise when:", "- the gas used for verification exceeded the `verificationGasLimit`"].filter(Boolean),
			name: "VerificationGasLimitExceededError"
		});
	}
};
Object.defineProperty(VerificationGasLimitExceededError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa40/
});
var VerificationGasLimitTooLowError = class extends BaseError {
	constructor({ cause }) {
		super("User Operation verification gas limit is too low.", {
			cause,
			metaMessages: ["This could arise when:", "- the `verificationGasLimit` is too low to verify the User Operation"].filter(Boolean),
			name: "VerificationGasLimitTooLowError"
		});
	}
};
Object.defineProperty(VerificationGasLimitTooLowError, "message", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /aa41/
});
//#endregion
//#region node_modules/viem/_esm/account-abstraction/errors/userOperation.js
var UserOperationExecutionError = class extends BaseError {
	constructor(cause, { callData, callGasLimit, docsPath, factory, factoryData, initCode, maxFeePerGas, maxPriorityFeePerGas, nonce, paymaster, paymasterAndData, paymasterData, paymasterPostOpGasLimit, paymasterVerificationGasLimit, preVerificationGas, sender, signature, verificationGasLimit }) {
		const prettyArgs = prettyPrint({
			callData,
			callGasLimit,
			factory,
			factoryData,
			initCode,
			maxFeePerGas: typeof maxFeePerGas !== "undefined" && `${formatGwei(maxFeePerGas)} gwei`,
			maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== "undefined" && `${formatGwei(maxPriorityFeePerGas)} gwei`,
			nonce,
			paymaster,
			paymasterAndData,
			paymasterData,
			paymasterPostOpGasLimit,
			paymasterVerificationGasLimit,
			preVerificationGas,
			sender,
			signature,
			verificationGasLimit
		});
		super(cause.shortMessage, {
			cause,
			docsPath,
			metaMessages: [
				...cause.metaMessages ? [...cause.metaMessages, " "] : [],
				"Request Arguments:",
				prettyArgs
			].filter(Boolean),
			name: "UserOperationExecutionError"
		});
		Object.defineProperty(this, "cause", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.cause = cause;
	}
};
var UserOperationReceiptNotFoundError = class extends BaseError {
	constructor({ hash }) {
		super(`User Operation receipt with hash "${hash}" could not be found. The User Operation may not have been processed yet.`, { name: "UserOperationReceiptNotFoundError" });
	}
};
var UserOperationNotFoundError = class extends BaseError {
	constructor({ hash }) {
		super(`User Operation with hash "${hash}" could not be found.`, { name: "UserOperationNotFoundError" });
	}
};
var WaitForUserOperationReceiptTimeoutError = class extends BaseError {
	constructor({ hash }) {
		super(`Timed out while waiting for User Operation with hash "${hash}" to be confirmed.`, { name: "WaitForUserOperationReceiptTimeoutError" });
	}
};
//#endregion
//#region node_modules/viem/_esm/account-abstraction/utils/errors/getBundlerError.js
var bundlerErrors = [
	ExecutionRevertedError,
	InvalidFieldsError,
	PaymasterDepositTooLowError,
	PaymasterRateLimitError,
	PaymasterStakeTooLowError,
	SignatureCheckFailedError,
	UnsupportedSignatureAggregatorError,
	UserOperationOutOfTimeRangeError,
	UserOperationRejectedByEntryPointError,
	UserOperationRejectedByPaymasterError,
	UserOperationRejectedByOpCodeError
];
function getBundlerError(err, args) {
	const message = (err.details || "").toLowerCase();
	if (AccountNotDeployedError.message.test(message)) return new AccountNotDeployedError({ cause: err });
	if (FailedToSendToBeneficiaryError.message.test(message)) return new FailedToSendToBeneficiaryError({ cause: err });
	if (GasValuesOverflowError.message.test(message)) return new GasValuesOverflowError({ cause: err });
	if (HandleOpsOutOfGasError.message.test(message)) return new HandleOpsOutOfGasError({ cause: err });
	if (InitCodeFailedError.message.test(message)) return new InitCodeFailedError({
		cause: err,
		factory: args.factory,
		factoryData: args.factoryData,
		initCode: args.initCode
	});
	if (InitCodeMustCreateSenderError.message.test(message)) return new InitCodeMustCreateSenderError({
		cause: err,
		factory: args.factory,
		factoryData: args.factoryData,
		initCode: args.initCode
	});
	if (InitCodeMustReturnSenderError.message.test(message)) return new InitCodeMustReturnSenderError({
		cause: err,
		factory: args.factory,
		factoryData: args.factoryData,
		initCode: args.initCode,
		sender: args.sender
	});
	if (InsufficientPrefundError.message.test(message)) return new InsufficientPrefundError({ cause: err });
	if (InternalCallOnlyError.message.test(message)) return new InternalCallOnlyError({ cause: err });
	if (InvalidAccountNonceError.message.test(message)) return new InvalidAccountNonceError({
		cause: err,
		nonce: args.nonce
	});
	if (InvalidAggregatorError.message.test(message)) return new InvalidAggregatorError({ cause: err });
	if (InvalidBeneficiaryError.message.test(message)) return new InvalidBeneficiaryError({ cause: err });
	if (InvalidPaymasterAndDataError.message.test(message)) return new InvalidPaymasterAndDataError({ cause: err });
	if (PaymasterDepositTooLowError.message.test(message)) return new PaymasterDepositTooLowError({ cause: err });
	if (PaymasterFunctionRevertedError.message.test(message)) return new PaymasterFunctionRevertedError({ cause: err });
	if (PaymasterNotDeployedError.message.test(message)) return new PaymasterNotDeployedError({ cause: err });
	if (PaymasterPostOpFunctionRevertedError.message.test(message)) return new PaymasterPostOpFunctionRevertedError({ cause: err });
	if (SmartAccountFunctionRevertedError.message.test(message)) return new SmartAccountFunctionRevertedError({ cause: err });
	if (SenderAlreadyConstructedError.message.test(message)) return new SenderAlreadyConstructedError({
		cause: err,
		factory: args.factory,
		factoryData: args.factoryData,
		initCode: args.initCode
	});
	if (UserOperationExpiredError.message.test(message)) return new UserOperationExpiredError({ cause: err });
	if (UserOperationPaymasterExpiredError.message.test(message)) return new UserOperationPaymasterExpiredError({ cause: err });
	if (UserOperationPaymasterSignatureError.message.test(message)) return new UserOperationPaymasterSignatureError({ cause: err });
	if (UserOperationSignatureError.message.test(message)) return new UserOperationSignatureError({ cause: err });
	if (VerificationGasLimitExceededError.message.test(message)) return new VerificationGasLimitExceededError({ cause: err });
	if (VerificationGasLimitTooLowError.message.test(message)) return new VerificationGasLimitTooLowError({ cause: err });
	const error = err.walk((e) => bundlerErrors.some((error) => error.code === e.code));
	if (error) {
		if (error.code === ExecutionRevertedError.code) return new ExecutionRevertedError({
			cause: err,
			data: error.data,
			message: error.details
		});
		if (error.code === InvalidFieldsError.code) return new InvalidFieldsError({ cause: err });
		if (error.code === PaymasterDepositTooLowError.code) return new PaymasterDepositTooLowError({ cause: err });
		if (error.code === PaymasterRateLimitError.code) return new PaymasterRateLimitError({ cause: err });
		if (error.code === PaymasterStakeTooLowError.code) return new PaymasterStakeTooLowError({ cause: err });
		if (error.code === SignatureCheckFailedError.code) return new SignatureCheckFailedError({ cause: err });
		if (error.code === UnsupportedSignatureAggregatorError.code) return new UnsupportedSignatureAggregatorError({ cause: err });
		if (error.code === UserOperationOutOfTimeRangeError.code) return new UserOperationOutOfTimeRangeError({ cause: err });
		if (error.code === UserOperationRejectedByEntryPointError.code) return new UserOperationRejectedByEntryPointError({ cause: err });
		if (error.code === UserOperationRejectedByPaymasterError.code) return new UserOperationRejectedByPaymasterError({ cause: err });
		if (error.code === UserOperationRejectedByOpCodeError.code) return new UserOperationRejectedByOpCodeError({ cause: err });
	}
	return new UnknownBundlerError({ cause: err });
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/utils/errors/getUserOperationError.js
function getUserOperationError(err, { calls, docsPath, ...args }) {
	return new UserOperationExecutionError((() => {
		const cause = getBundlerError(err, args);
		if (calls && cause instanceof ExecutionRevertedError) {
			const revertData = getRevertData(cause);
			const contractCalls = calls?.filter((call) => call.abi);
			if (revertData && contractCalls.length > 0) return getContractError({
				calls: contractCalls,
				revertData
			});
		}
		return cause;
	})(), {
		docsPath,
		...args
	});
}
function getRevertData(error) {
	let revertData;
	error.walk((e) => {
		const error = e;
		if (typeof error.data === "string" || typeof error.data?.revertData === "string" || !(error instanceof BaseError) && typeof error.message === "string") {
			const match = (error.data?.revertData || error.data || error.message).match?.(/(0x[A-Za-z0-9]*)/);
			if (match) {
				revertData = match[1];
				return true;
			}
		}
		return false;
	});
	return revertData;
}
function getContractError(parameters) {
	const { calls, revertData } = parameters;
	const { abi, functionName, args, to } = (() => {
		const contractCalls = calls?.filter((call) => Boolean(call.abi));
		if (contractCalls.length === 1) return contractCalls[0];
		const compatContractCalls = contractCalls.filter((call) => {
			try {
				return Boolean(decodeErrorResult({
					abi: call.abi,
					data: revertData
				}));
			} catch {
				return false;
			}
		});
		if (compatContractCalls.length === 1) return compatContractCalls[0];
		return {
			abi: [],
			functionName: contractCalls.reduce((acc, call) => `${acc ? `${acc} | ` : ""}${call.functionName}`, ""),
			args: void 0,
			to: void 0
		};
	})();
	return new ContractFunctionExecutionError((() => {
		if (revertData === "0x") return new ContractFunctionZeroDataError({ functionName });
		return new ContractFunctionRevertedError({
			abi,
			data: revertData,
			functionName
		});
	})(), {
		abi,
		args,
		contractAddress: to,
		functionName
	});
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/utils/formatters/userOperationGas.js
function formatUserOperationGas(parameters) {
	const gas = {};
	if (parameters.callGasLimit) gas.callGasLimit = BigInt(parameters.callGasLimit);
	if (parameters.preVerificationGas) gas.preVerificationGas = BigInt(parameters.preVerificationGas);
	if (parameters.verificationGasLimit) gas.verificationGasLimit = BigInt(parameters.verificationGasLimit);
	if (parameters.paymasterPostOpGasLimit) gas.paymasterPostOpGasLimit = BigInt(parameters.paymasterPostOpGasLimit);
	if (parameters.paymasterVerificationGasLimit) gas.paymasterVerificationGasLimit = BigInt(parameters.paymasterVerificationGasLimit);
	return gas;
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/utils/formatters/userOperationRequest.js
function formatUserOperationRequest(request) {
	const rpcRequest = {};
	if (typeof request.callData !== "undefined") rpcRequest.callData = request.callData;
	if (typeof request.callGasLimit !== "undefined") rpcRequest.callGasLimit = numberToHex(request.callGasLimit);
	if (typeof request.factory !== "undefined") rpcRequest.factory = request.factory;
	if (typeof request.factoryData !== "undefined") rpcRequest.factoryData = request.factoryData;
	if (typeof request.initCode !== "undefined") rpcRequest.initCode = request.initCode;
	if (typeof request.maxFeePerGas !== "undefined") rpcRequest.maxFeePerGas = numberToHex(request.maxFeePerGas);
	if (typeof request.maxPriorityFeePerGas !== "undefined") rpcRequest.maxPriorityFeePerGas = numberToHex(request.maxPriorityFeePerGas);
	if (typeof request.nonce !== "undefined") rpcRequest.nonce = numberToHex(request.nonce);
	if (typeof request.paymaster !== "undefined") rpcRequest.paymaster = request.paymaster;
	if (typeof request.paymasterAndData !== "undefined") rpcRequest.paymasterAndData = request.paymasterAndData || "0x";
	if (typeof request.paymasterData !== "undefined") rpcRequest.paymasterData = request.paymasterData;
	if (typeof request.paymasterPostOpGasLimit !== "undefined") rpcRequest.paymasterPostOpGasLimit = numberToHex(request.paymasterPostOpGasLimit);
	if (typeof request.paymasterSignature !== "undefined") rpcRequest.paymasterSignature = request.paymasterSignature;
	if (typeof request.paymasterVerificationGasLimit !== "undefined") rpcRequest.paymasterVerificationGasLimit = numberToHex(request.paymasterVerificationGasLimit);
	if (typeof request.preVerificationGas !== "undefined") rpcRequest.preVerificationGas = numberToHex(request.preVerificationGas);
	if (typeof request.sender !== "undefined") rpcRequest.sender = request.sender;
	if (typeof request.signature !== "undefined") rpcRequest.signature = request.signature;
	if (typeof request.verificationGasLimit !== "undefined") rpcRequest.verificationGasLimit = numberToHex(request.verificationGasLimit);
	if (typeof request.authorization !== "undefined") rpcRequest.eip7702Auth = formatAuthorization(request.authorization);
	return rpcRequest;
}
function formatAuthorization(authorization) {
	return {
		address: authorization.address,
		chainId: numberToHex(authorization.chainId),
		nonce: numberToHex(authorization.nonce),
		r: authorization.r ? numberToHex(BigInt(authorization.r), { size: 32 }) : pad("0x", { size: 32 }),
		s: authorization.s ? numberToHex(BigInt(authorization.s), { size: 32 }) : pad("0x", { size: 32 }),
		yParity: authorization.yParity ? numberToHex(authorization.yParity, { size: 1 }) : pad("0x", { size: 32 })
	};
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/paymaster/getPaymasterData.js
/**
* Retrieves paymaster-related User Operation properties to be used for sending the User Operation.
*
* - Docs: https://viem.sh/account-abstraction/actions/paymaster/getPaymasterData
*
* @param client - Client to use
* @param parameters - {@link GetPaymasterDataParameters}
* @returns Paymaster-related User Operation properties. {@link GetPaymasterDataReturnType}
*
* @example
* import { http } from 'viem'
* import { createPaymasterClient, getPaymasterData } from 'viem/account-abstraction'
*
* const paymasterClient = createPaymasterClient({
*   transport: http('https://...'),
* })
*
* const userOperation = { ... }
*
* const values = await getPaymasterData(paymasterClient, {
*   chainId: 1,
*   entryPointAddress: '0x...',
*   ...userOperation,
* })
*/
async function getPaymasterData(client, parameters) {
	const { chainId, entryPointAddress, context, ...userOperation } = parameters;
	const request = formatUserOperationRequest(userOperation);
	const { paymasterPostOpGasLimit, paymasterVerificationGasLimit, ...rest } = await client.request({
		method: "pm_getPaymasterData",
		params: [
			{
				...request,
				callGasLimit: request.callGasLimit ?? "0x0",
				verificationGasLimit: request.verificationGasLimit ?? "0x0",
				preVerificationGas: request.preVerificationGas ?? "0x0"
			},
			entryPointAddress,
			numberToHex(chainId),
			context
		]
	});
	return {
		...rest,
		...paymasterPostOpGasLimit && { paymasterPostOpGasLimit: hexToBigInt(paymasterPostOpGasLimit) },
		...paymasterVerificationGasLimit && { paymasterVerificationGasLimit: hexToBigInt(paymasterVerificationGasLimit) }
	};
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/paymaster/getPaymasterStubData.js
/**
* Retrieves paymaster-related User Operation properties to be used for gas estimation.
*
* - Docs: https://viem.sh/account-abstraction/actions/paymaster/getPaymasterStubData
*
* @param client - Client to use
* @param parameters - {@link GetPaymasterStubDataParameters}
* @returns Paymaster-related User Operation properties. {@link GetPaymasterStubDataReturnType}
*
* @example
* import { http } from 'viem'
* import { createPaymasterClient, getPaymasterStubData } from 'viem/account-abstraction'
*
* const paymasterClient = createPaymasterClient({
*   transport: http('https://...'),
* })
*
* const userOperation = { ... }
*
* const values = await getPaymasterStubData(paymasterClient, {
*   chainId: 1,
*   entryPointAddress: '0x...',
*   ...userOperation,
* })
*/
async function getPaymasterStubData(client, parameters) {
	const { chainId, entryPointAddress, context, ...userOperation } = parameters;
	const request = formatUserOperationRequest(userOperation);
	const { paymasterPostOpGasLimit, paymasterVerificationGasLimit, ...rest } = await client.request({
		method: "pm_getPaymasterStubData",
		params: [
			{
				...request,
				callGasLimit: request.callGasLimit ?? "0x0",
				verificationGasLimit: request.verificationGasLimit ?? "0x0",
				preVerificationGas: request.preVerificationGas ?? "0x0"
			},
			entryPointAddress,
			numberToHex(chainId),
			context
		]
	});
	return {
		...rest,
		...paymasterPostOpGasLimit && { paymasterPostOpGasLimit: hexToBigInt(paymasterPostOpGasLimit) },
		...paymasterVerificationGasLimit && { paymasterVerificationGasLimit: hexToBigInt(paymasterVerificationGasLimit) }
	};
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/bundler/prepareUserOperation.js
var defaultParameters = [
	"factory",
	"fees",
	"gas",
	"paymaster",
	"nonce",
	"signature",
	"authorization"
];
/**
* Prepares a User Operation and fills in missing properties.
*
* - Docs: https://viem.sh/actions/bundler/prepareUserOperation
*
* @param args - {@link PrepareUserOperationParameters}
* @returns The User Operation. {@link PrepareUserOperationReturnType}
*
* @example
* import { createBundlerClient, http } from 'viem'
* import { toSmartAccount } from 'viem/accounts'
* import { mainnet } from 'viem/chains'
* import { prepareUserOperation } from 'viem/actions'
*
* const account = await toSmartAccount({ ... })
*
* const client = createBundlerClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const request = await prepareUserOperation(client, {
*   account,
*   calls: [{ to: '0x...', value: parseEther('1') }],
* })
*/
async function prepareUserOperation(client, parameters_) {
	const parameters = parameters_;
	const { account: account_ = client.account, dataSuffix = typeof client.dataSuffix === "string" ? client.dataSuffix : client.dataSuffix?.value, parameters: properties = defaultParameters, stateOverride } = parameters;
	if (!account_) throw new AccountNotFoundError();
	const account = parseAccount(account_);
	const bundlerClient = client;
	const paymaster = parameters.paymaster ?? bundlerClient?.paymaster;
	const paymasterAddress = typeof paymaster === "string" ? paymaster : void 0;
	const { getPaymasterStubData: getPaymasterStubData$1, getPaymasterData: getPaymasterData$1 } = (() => {
		if (paymaster === true) return {
			getPaymasterStubData: (parameters) => getAction(bundlerClient, getPaymasterStubData, "getPaymasterStubData")(parameters),
			getPaymasterData: (parameters) => getAction(bundlerClient, getPaymasterData, "getPaymasterData")(parameters)
		};
		if (typeof paymaster === "object") {
			const { getPaymasterStubData, getPaymasterData } = paymaster;
			return {
				getPaymasterStubData: getPaymasterData && getPaymasterStubData ? getPaymasterStubData : getPaymasterData,
				getPaymasterData: getPaymasterData && getPaymasterStubData ? getPaymasterData : void 0
			};
		}
		return {
			getPaymasterStubData: void 0,
			getPaymasterData: void 0
		};
	})();
	const paymasterContext = parameters.paymasterContext ? parameters.paymasterContext : bundlerClient?.paymasterContext;
	let request = {
		...parameters,
		paymaster: paymasterAddress,
		sender: account.address
	};
	const [callData, factory, fees, nonce, authorization] = await Promise.all([
		(async () => {
			if (parameters.calls) return account.encodeCalls(parameters.calls.map((call_) => {
				const call = call_;
				if (call.abi) return {
					data: encodeFunctionData(call),
					to: call.to,
					value: call.value
				};
				return call;
			}));
			return parameters.callData;
		})(),
		(async () => {
			if (!properties.includes("factory")) return void 0;
			if (parameters.initCode) return { initCode: parameters.initCode };
			if (parameters.factory && parameters.factoryData) return {
				factory: parameters.factory,
				factoryData: parameters.factoryData
			};
			const { factory, factoryData } = await account.getFactoryArgs();
			if (account.entryPoint.version === "0.6") return { initCode: factory && factoryData ? concat([factory, factoryData]) : void 0 };
			return {
				factory,
				factoryData
			};
		})(),
		(async () => {
			if (!properties.includes("fees")) return void 0;
			if (typeof parameters.maxFeePerGas === "bigint" && typeof parameters.maxPriorityFeePerGas === "bigint") return request;
			if (bundlerClient?.userOperation?.estimateFeesPerGas) {
				const fees = await bundlerClient.userOperation.estimateFeesPerGas({
					account,
					bundlerClient,
					userOperation: request
				});
				return {
					...request,
					...fees
				};
			}
			try {
				const client_ = bundlerClient.client ?? client;
				const fees = await getAction(client_, estimateFeesPerGas, "estimateFeesPerGas")({
					chain: client_.chain,
					type: "eip1559"
				});
				return {
					maxFeePerGas: typeof parameters.maxFeePerGas === "bigint" ? parameters.maxFeePerGas : BigInt(2n * fees.maxFeePerGas),
					maxPriorityFeePerGas: typeof parameters.maxPriorityFeePerGas === "bigint" ? parameters.maxPriorityFeePerGas : BigInt(2n * fees.maxPriorityFeePerGas)
				};
			} catch {
				return;
			}
		})(),
		(async () => {
			if (!properties.includes("nonce")) return void 0;
			if (typeof parameters.nonce === "bigint") return parameters.nonce;
			return account.getNonce();
		})(),
		(async () => {
			if (!properties.includes("authorization")) return void 0;
			if (typeof parameters.authorization === "object") return parameters.authorization;
			if (account.authorization && !await account.isDeployed()) return {
				...await prepareAuthorization(account.client, account.authorization),
				r: "0xfffffffffffffffffffffffffffffff000000000000000000000000000000000",
				s: "0x7aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				yParity: 1
			};
		})()
	]);
	if (typeof callData !== "undefined") request.callData = dataSuffix ? concat([callData, dataSuffix]) : callData;
	if (typeof factory !== "undefined") request = {
		...request,
		...factory
	};
	if (typeof fees !== "undefined") request = {
		...request,
		...fees
	};
	if (typeof nonce !== "undefined") request.nonce = nonce;
	if (typeof authorization !== "undefined") request.authorization = authorization;
	if (properties.includes("signature")) if (typeof parameters.signature !== "undefined") request.signature = parameters.signature;
	else request.signature = await account.getStubSignature(request);
	if (account.entryPoint.version === "0.6" && !request.initCode) request.initCode = "0x";
	let chainId;
	async function getChainId$1() {
		if (chainId) return chainId;
		if (client.chain) return client.chain.id;
		chainId = await getAction(client, getChainId, "getChainId")({});
		return chainId;
	}
	let isPaymasterPopulated = false;
	if (properties.includes("paymaster") && getPaymasterStubData$1 && !paymasterAddress && !parameters.paymasterAndData) {
		const { isFinal = false, sponsor: _, ...paymasterArgs } = await getPaymasterStubData$1({
			chainId: await getChainId$1(),
			entryPointAddress: account.entryPoint.address,
			context: paymasterContext,
			...request
		});
		isPaymasterPopulated = isFinal;
		request = {
			...request,
			...paymasterArgs
		};
	}
	if (account.entryPoint.version === "0.6" && !request.paymasterAndData) request.paymasterAndData = "0x";
	if (properties.includes("gas")) {
		if (account.userOperation?.estimateGas) {
			const gas = await account.userOperation.estimateGas(request);
			request = {
				...request,
				...gas
			};
		}
		if (typeof request.callGasLimit === "undefined" || typeof request.preVerificationGas === "undefined" || typeof request.verificationGasLimit === "undefined" || request.paymaster && typeof request.paymasterPostOpGasLimit === "undefined" || request.paymaster && typeof request.paymasterVerificationGasLimit === "undefined") {
			const gas = await getAction(bundlerClient, estimateUserOperationGas, "estimateUserOperationGas")({
				account,
				callGasLimit: 0n,
				preVerificationGas: 0n,
				verificationGasLimit: 0n,
				stateOverride,
				...request.paymaster ? {
					paymasterPostOpGasLimit: 0n,
					paymasterVerificationGasLimit: 0n
				} : {},
				...request
			});
			request = {
				...request,
				callGasLimit: request.callGasLimit ?? gas.callGasLimit,
				preVerificationGas: request.preVerificationGas ?? gas.preVerificationGas,
				verificationGasLimit: request.verificationGasLimit ?? gas.verificationGasLimit,
				paymasterPostOpGasLimit: request.paymasterPostOpGasLimit ?? gas.paymasterPostOpGasLimit,
				paymasterVerificationGasLimit: request.paymasterVerificationGasLimit ?? gas.paymasterVerificationGasLimit
			};
		}
	}
	if (properties.includes("paymaster") && getPaymasterData$1 && !paymasterAddress && !parameters.paymasterAndData && !isPaymasterPopulated) {
		const paymaster = await getPaymasterData$1({
			chainId: await getChainId$1(),
			entryPointAddress: account.entryPoint.address,
			context: paymasterContext,
			...request
		});
		request = {
			...request,
			...paymaster
		};
	}
	delete request.calls;
	delete request.parameters;
	delete request.paymasterContext;
	if (typeof request.paymaster !== "string") delete request.paymaster;
	return request;
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/bundler/estimateUserOperationGas.js
/**
* Returns an estimate of gas values necessary to execute the User Operation.
*
* - Docs: https://viem.sh/actions/bundler/estimateUserOperationGas
*
* @param client - Client to use
* @param parameters - {@link EstimateUserOperationGasParameters}
* @returns The gas estimate (in wei). {@link EstimateUserOperationGasReturnType}
*
* @example
* import { createBundlerClient, http, parseEther } from 'viem'
* import { toSmartAccount } from 'viem/accounts'
* import { mainnet } from 'viem/chains'
* import { estimateUserOperationGas } from 'viem/actions'
*
* const account = await toSmartAccount({ ... })
*
* const bundlerClient = createBundlerClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const values = await estimateUserOperationGas(bundlerClient, {
*   account,
*   calls: [{ to: '0x...', value: parseEther('1') }],
* })
*/
async function estimateUserOperationGas(client, parameters) {
	const { account: account_ = client.account, entryPointAddress, stateOverride } = parameters;
	if (!account_ && !parameters.sender) throw new AccountNotFoundError();
	const account = account_ ? parseAccount(account_) : void 0;
	const rpcStateOverride = serializeStateOverride(stateOverride);
	const request = account ? await getAction(client, prepareUserOperation, "prepareUserOperation")({
		...parameters,
		parameters: [
			"authorization",
			"factory",
			"nonce",
			"paymaster",
			"signature"
		]
	}) : parameters;
	try {
		const params = [formatUserOperationRequest(request), entryPointAddress ?? account?.entryPoint?.address];
		return formatUserOperationGas(await client.request({
			method: "eth_estimateUserOperationGas",
			params: rpcStateOverride ? [...params, rpcStateOverride] : [...params]
		}));
	} catch (error) {
		const calls = parameters.calls;
		throw getUserOperationError(error, {
			...request,
			...calls ? { calls } : {}
		});
	}
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/bundler/getSupportedEntryPoints.js
/**
* Returns the EntryPoints that the bundler supports.
*
* - Docs: https://viem.sh/actions/bundler/getSupportedEntryPoints
*
* @param client - Client to use
* @param parameters - {@link GetSupportedEntryPointsParameters}
* @returns Supported Entry Points. {@link GetSupportedEntryPointsReturnType}
*
* @example
* import { createBundlerClient, http, parseEther } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getSupportedEntryPoints } from 'viem/actions'
*
* const bundlerClient = createBundlerClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const addresses = await getSupportedEntryPoints(bundlerClient)
*/
function getSupportedEntryPoints(client) {
	return client.request({ method: "eth_supportedEntryPoints" });
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/utils/formatters/userOperation.js
function formatUserOperation(parameters) {
	const userOperation = { ...parameters };
	if (parameters.callGasLimit) userOperation.callGasLimit = BigInt(parameters.callGasLimit);
	if (parameters.maxFeePerGas) userOperation.maxFeePerGas = BigInt(parameters.maxFeePerGas);
	if (parameters.maxPriorityFeePerGas) userOperation.maxPriorityFeePerGas = BigInt(parameters.maxPriorityFeePerGas);
	if (parameters.nonce) userOperation.nonce = BigInt(parameters.nonce);
	if (parameters.paymasterPostOpGasLimit) userOperation.paymasterPostOpGasLimit = BigInt(parameters.paymasterPostOpGasLimit);
	if (parameters.paymasterVerificationGasLimit) userOperation.paymasterVerificationGasLimit = BigInt(parameters.paymasterVerificationGasLimit);
	if (parameters.preVerificationGas) userOperation.preVerificationGas = BigInt(parameters.preVerificationGas);
	if (parameters.verificationGasLimit) userOperation.verificationGasLimit = BigInt(parameters.verificationGasLimit);
	return userOperation;
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/bundler/getUserOperation.js
/**
* Retrieves information about a User Operation given a hash.
*
* - Docs: https://viem.sh/account-abstraction/actions/bundler/getUserOperation
*
* @param client - Client to use
* @param parameters - {@link GetUserOperationParameters}
* @returns The receipt. {@link GetUserOperationReturnType}
*
* @example
* import { createBundlerClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getUserOperation } from 'viem/actions
*
* const client = createBundlerClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const receipt = await getUserOperation(client, {
*   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
* })
*/
async function getUserOperation(client, { hash }) {
	const result = await client.request({
		method: "eth_getUserOperationByHash",
		params: [hash]
	}, { dedupe: true });
	if (!result) throw new UserOperationNotFoundError({ hash });
	const { blockHash, blockNumber, entryPoint, transactionHash, userOperation } = result;
	return {
		blockHash,
		blockNumber: BigInt(blockNumber),
		entryPoint,
		transactionHash,
		userOperation: formatUserOperation(userOperation)
	};
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/utils/formatters/userOperationReceipt.js
function formatUserOperationReceipt(parameters) {
	const receipt = { ...parameters };
	if (parameters.actualGasCost) receipt.actualGasCost = BigInt(parameters.actualGasCost);
	if (parameters.actualGasUsed) receipt.actualGasUsed = BigInt(parameters.actualGasUsed);
	if (parameters.logs) receipt.logs = parameters.logs.map((log) => formatLog(log));
	if (parameters.receipt) receipt.receipt = formatTransactionReceipt(receipt.receipt);
	return receipt;
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/bundler/getUserOperationReceipt.js
/**
* Returns the User Operation Receipt given a User Operation hash.
*
* - Docs: https://viem.sh/docs/actions/bundler/getUserOperationReceipt
*
* @param client - Client to use
* @param parameters - {@link GetUserOperationReceiptParameters}
* @returns The receipt. {@link GetUserOperationReceiptReturnType}
*
* @example
* import { createBundlerClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getUserOperationReceipt } from 'viem/actions
*
* const client = createBundlerClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const receipt = await getUserOperationReceipt(client, {
*   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
* })
*/
async function getUserOperationReceipt(client, { hash }) {
	const receipt = await client.request({
		method: "eth_getUserOperationReceipt",
		params: [hash]
	}, { dedupe: true });
	if (!receipt) throw new UserOperationReceiptNotFoundError({ hash });
	return formatUserOperationReceipt(receipt);
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/bundler/sendUserOperation.js
/**
* Broadcasts a User Operation to the Bundler.
*
* - Docs: https://viem.sh/actions/bundler/sendUserOperation
*
* @param client - Client to use
* @param parameters - {@link SendUserOperationParameters}
* @returns The User Operation hash. {@link SendUserOperationReturnType}
*
* @example
* import { createBundlerClient, http, parseEther } from 'viem'
* import { mainnet } from 'viem/chains'
* import { toSmartAccount } from 'viem/accounts'
* import { sendUserOperation } from 'viem/actions'
*
* const account = await toSmartAccount({ ... })
*
* const bundlerClient = createBundlerClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const values = await sendUserOperation(bundlerClient, {
*   account,
*   calls: [{ to: '0x...', value: parseEther('1') }],
* })
*/
async function sendUserOperation(client, parameters) {
	const { account: account_ = client.account, entryPointAddress } = parameters;
	if (!account_ && !parameters.sender) throw new AccountNotFoundError();
	const account = account_ ? parseAccount(account_) : void 0;
	const request = account ? await getAction(client, prepareUserOperation, "prepareUserOperation")(parameters) : parameters;
	const signature = parameters.signature || await account?.signUserOperation?.(request);
	const rpcParameters = formatUserOperationRequest({
		...request,
		signature
	});
	try {
		return await client.request({
			method: "eth_sendUserOperation",
			params: [rpcParameters, entryPointAddress ?? account?.entryPoint?.address]
		}, { retryCount: 0 });
	} catch (error) {
		const calls = parameters.calls;
		throw getUserOperationError(error, {
			...request,
			...calls ? { calls } : {},
			signature
		});
	}
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/actions/bundler/waitForUserOperationReceipt.js
/**
* Waits for the User Operation to be included on a [Block](https://viem.sh/docs/glossary/terms#block) (one confirmation), and then returns the User Operation receipt.
*
* - Docs: https://viem.sh/docs/actions/bundler/waitForUserOperationReceipt
*
* @param client - Client to use
* @param parameters - {@link WaitForUserOperationReceiptParameters}
* @returns The receipt. {@link WaitForUserOperationReceiptReturnType}
*
* @example
* import { createBundlerClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { waitForUserOperationReceipt } from 'viem/actions'
*
* const client = createBundlerClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const receipt = await waitForUserOperationReceipt(client, {
*   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
* })
*/
function waitForUserOperationReceipt(client, parameters) {
	const { hash, pollingInterval = client.pollingInterval, retryCount, timeout = 12e4 } = parameters;
	let count = 0;
	const observerId = stringify([
		"waitForUserOperationReceipt",
		client.uid,
		hash
	]);
	return new Promise((resolve, reject) => {
		const unobserve = observe(observerId, {
			resolve,
			reject
		}, (emit) => {
			const done = (fn) => {
				unpoll();
				fn();
				unobserve();
			};
			const timeoutId = timeout ? setTimeout(() => done(() => emit.reject(new WaitForUserOperationReceiptTimeoutError({ hash }))), timeout) : void 0;
			const unpoll = poll(async () => {
				if (retryCount && count >= retryCount) {
					clearTimeout(timeoutId);
					done(() => emit.reject(new WaitForUserOperationReceiptTimeoutError({ hash })));
				}
				try {
					const receipt = await getAction(client, getUserOperationReceipt, "getUserOperationReceipt")({ hash });
					clearTimeout(timeoutId);
					done(() => emit.resolve(receipt));
				} catch (err) {
					const error = err;
					if (error.name !== "UserOperationReceiptNotFoundError") {
						clearTimeout(timeoutId);
						done(() => emit.reject(error));
					}
				}
				count++;
			}, {
				emitOnBegin: true,
				interval: pollingInterval
			});
			return unpoll;
		});
	});
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/clients/decorators/bundler.js
function bundlerActions(client) {
	return {
		estimateUserOperationGas: (parameters) => estimateUserOperationGas(client, parameters),
		getChainId: () => getChainId(client),
		getSupportedEntryPoints: () => getSupportedEntryPoints(client),
		getUserOperation: (parameters) => getUserOperation(client, parameters),
		getUserOperationReceipt: (parameters) => getUserOperationReceipt(client, parameters),
		prepareUserOperation: (parameters) => prepareUserOperation(client, parameters),
		sendUserOperation: (parameters) => sendUserOperation(client, parameters),
		waitForUserOperationReceipt: (parameters) => waitForUserOperationReceipt(client, parameters)
	};
}
//#endregion
//#region node_modules/viem/_esm/account-abstraction/clients/createBundlerClient.js
function createBundlerClient(parameters) {
	const { client: client_, dataSuffix, key = "bundler", name = "Bundler Client", paymaster, paymasterContext, transport, userOperation } = parameters;
	return Object.assign(createClient({
		...parameters,
		chain: parameters.chain ?? client_?.chain,
		key,
		name,
		transport,
		type: "bundlerClient"
	}), {
		client: client_,
		dataSuffix: dataSuffix ?? client_?.dataSuffix,
		paymaster,
		paymasterContext,
		userOperation
	}).extend(bundlerActions);
}
//#endregion
export { ccip_exports as a, defineChain as i, toWebAuthnAccount as n, createPublicClient as r, createBundlerClient as t };
