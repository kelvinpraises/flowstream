import { b as fromHex, o as p256, x as BaseError, y as fromBytes } from "./@circle-fin/modular-wallets-core.mjs";
//#region node_modules/ox/_esm/core/Base64.js
var encoder = /* @__PURE__ */ new TextEncoder();
Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/").map((a, i) => [i, a.charCodeAt(0)]);
var characterToInteger = {
	...Object.fromEntries(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/").map((a, i) => [a.charCodeAt(0), i])),
	["=".charCodeAt(0)]: 0,
	["-".charCodeAt(0)]: 62,
	["_".charCodeAt(0)]: 63
};
/**
* Decodes a Base64-encoded string (with optional padding and/or URL-safe characters) to {@link ox#Bytes.Bytes}.
*
* @example
* ```ts twoslash
* import { Base64, Bytes } from 'ox'
*
* const value = Base64.toBytes('aGVsbG8gd29ybGQ=')
* // @log: Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
* ```
*
* @param value - The string, hex value, or byte array to encode.
* @returns The Base64 decoded {@link ox#Bytes.Bytes}.
*/
function toBytes(value) {
	const base64 = value.replace(/=+$/, "");
	const size = base64.length;
	const decoded = new Uint8Array(size + 3);
	encoder.encodeInto(base64 + "===", decoded);
	for (let i = 0, j = 0; i < base64.length; i += 4, j += 3) {
		const x = (characterToInteger[decoded[i]] << 18) + (characterToInteger[decoded[i + 1]] << 12) + (characterToInteger[decoded[i + 2]] << 6) + characterToInteger[decoded[i + 3]];
		decoded[j] = x >> 16;
		decoded[j + 1] = x >> 8 & 255;
		decoded[j + 2] = x & 255;
	}
	const decodedSize = (size >> 2) * 3 + (size % 4 && size % 4 - 1);
	return new Uint8Array(decoded.buffer, 0, decodedSize);
}
//#endregion
//#region node_modules/ox/_esm/core/internal/webauthn.js
/**
* Parses an ASN.1 signature into a r and s value.
*
* @internal
*/
function parseAsn1Signature(bytes) {
	const sig = p256.Signature.fromDER(bytes).normalizeS();
	return {
		r: sig.r,
		s: sig.s
	};
}
//#endregion
//#region node_modules/ox/_esm/webauthn/Authentication.js
/**
* Returns the request options to sign a challenge with the Web Authentication API.
*
* @example
* ```ts twoslash
* import { Authentication } from 'ox/webauthn'
*
* const options = Authentication.getOptions({
*   challenge: '0xdeadbeef',
* })
*
* const credential = await window.navigator.credentials.get(options)
* ```
*
* @param options - Options.
* @returns The credential request options.
*/
function getOptions(options) {
	const { credentialId, challenge, extensions, rpId = window.location.hostname, userVerification = "required" } = options;
	return { publicKey: {
		...credentialId ? { allowCredentials: Array.isArray(credentialId) ? credentialId.map((id) => ({
			id: toBytes(id),
			type: "public-key"
		})) : [{
			id: toBytes(credentialId),
			type: "public-key"
		}] } : {},
		challenge: fromHex(challenge),
		...extensions && { extensions },
		rpId,
		userVerification
	} };
}
/**
* Signs a challenge using a stored WebAuthn P256 Credential. If no Credential is provided,
* a prompt will be displayed for the user to select an existing Credential
* that was previously registered.
*
* @example
* ```ts twoslash
* import { Registration, Authentication } from 'ox/webauthn'
*
* const credential = await Registration.create({
*   name: 'Example',
* })
*
* const { metadata, signature } = await Authentication.sign({ // [!code focus]
*   credentialId: credential.id, // [!code focus]
*   challenge: '0xdeadbeef', // [!code focus]
* }) // [!code focus]
* // @log: {
* // @log:   metadata: {
* // @log:     authenticatorData: '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
* // @log:     clientDataJSON: '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
* // @log:     challengeIndex: 23,
* // @log:     typeIndex: 1,
* // @log:     userVerificationRequired: true,
* // @log:   },
* // @log:   signature: { r: 51231...4215n, s: 12345...6789n },
* // @log: }
* ```
*
* @param options - Options.
* @returns The signature.
*/
async function sign$1(options) {
	const { getFn = (opts) => window.navigator.credentials.get(opts), ...rest } = options;
	const requestOptions = "publicKey" in rest ? rest : getOptions(rest);
	try {
		const credential = await getFn(requestOptions);
		if (!credential) throw new SignFailedError();
		const response = credential.response;
		const clientDataJSONBytes = new Uint8Array(response.clientDataJSON);
		const authenticatorDataBytes = new Uint8Array(response.authenticatorData);
		const signatureBytes = new Uint8Array(response.signature);
		const id = credential.id;
		const clientDataJSON = String.fromCharCode(...clientDataJSONBytes);
		const challengeIndex = clientDataJSON.indexOf("\"challenge\"");
		const typeIndex = clientDataJSON.indexOf("\"type\"");
		const signature = parseAsn1Signature(signatureBytes);
		return {
			id,
			metadata: {
				authenticatorData: fromBytes(authenticatorDataBytes),
				clientDataJSON,
				challengeIndex,
				typeIndex,
				userVerificationRequired: requestOptions.publicKey.userVerification === "required"
			},
			signature,
			raw: credential
		};
	} catch (error) {
		throw new SignFailedError({ cause: error });
	}
}
/** Thrown when a WebAuthn P256 credential request fails. */
var SignFailedError = class extends BaseError {
	constructor({ cause } = {}) {
		super("Failed to request credential.", { cause });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Authentication.SignFailedError"
		});
	}
};
//#endregion
//#region node_modules/ox/_esm/core/WebAuthnP256.js
/**
* Signs a challenge using a stored WebAuthn P256 Credential. If no Credential is provided,
* a prompt will be displayed for the user to select an existing Credential
* that was previously registered.
*
* @example
* ```ts twoslash
* import { WebAuthnP256 } from 'ox'
*
* const credential = await WebAuthnP256.createCredential({
*   name: 'Example',
* })
*
* const { metadata, signature } = await WebAuthnP256.sign({ // [!code focus]
*   credentialId: credential.id, // [!code focus]
*   challenge: '0xdeadbeef', // [!code focus]
* }) // [!code focus]
* // @log: {
* // @log:   metadata: {
* // @log:     authenticatorData: '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
* // @log:     clientDataJSON: '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
* // @log:     challengeIndex: 23,
* // @log:     typeIndex: 1,
* // @log:     userVerificationRequired: true,
* // @log:   },
* // @log:   signature: { r: 51231...4215n, s: 12345...6789n },
* // @log: }
* ```
*
* @param options - Options.
* @returns The signature.
*/
async function sign(options) {
	return sign$1(options);
}
//#endregion
export { sign as t };
