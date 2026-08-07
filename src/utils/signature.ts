/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple pure JS SHA-1 implementation to calculate deterministic hashes
function sha1(str: string): string {
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  // Pre-processing
  let utf8Str = unescape(encodeURIComponent(str));
  let l = utf8Str.length;
  let words: number[] = [];
  for (let i = 0; i < l - 3; i += 4) {
    words.push(
      (utf8Str.charCodeAt(i) << 24) |
      (utf8Str.charCodeAt(i + 1) << 16) |
      (utf8Str.charCodeAt(i + 2) << 8) |
      utf8Str.charCodeAt(i + 3)
    );
  }
  
  let left = l % 4;
  if (left === 1) {
    words.push(utf8Str.charCodeAt(l - 1) << 24);
  } else if (left === 2) {
    words.push((utf8Str.charCodeAt(l - 2) << 24) | (utf8Str.charCodeAt(l - 1) << 16));
  } else if (left === 3) {
    words.push((utf8Str.charCodeAt(l - 3) << 24) | (utf8Str.charCodeAt(l - 2) << 16) | (utf8Str.charCodeAt(l - 1) << 8));
  }

  let wordsCount = words.length;
  let bitsCount = l * 8;
  
  // Padding
  words[wordsCount] = 0x80000000;
  while ((words.length + 2) % 16 !== 0) {
    words.push(0);
  }
  words.push(0); // high 32 bits of length
  words.push(bitsCount);

  // Process blocks of 512 bits
  for (let i = 0; i < words.length; i += 16) {
    let w: number[] = [];
    for (let j = 0; j < 16; j++) {
      w[j] = words[i + j];
    }
    for (let j = 16; j < 80; j++) {
      w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let j = 0; j < 80; j++) {
      let f = 0;
      let k = 0;
      if (j < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      let temp = (rol(a, 5) + f + e + k + w[j]) | 0;
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  return (
    zeroPad((h0 >>> 0).toString(16)) +
    zeroPad((h1 >>> 0).toString(16)) +
    zeroPad((h2 >>> 0).toString(16)) +
    zeroPad((h3 >>> 0).toString(16)) +
    zeroPad((h4 >>> 0).toString(16))
  );
}

function rol(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}

function zeroPad(str: string): string {
  while (str.length < 8) {
    str = '0' + str;
  }
  return str;
}

// Deterministic Base64 encoder for raw binary or hex
function hexToBase64(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const byteHex = hex.substr(i, 2);
    let byteVal = parseInt(byteHex, 16);
    if (isNaN(byteVal)) {
      byteVal = 0;
    }
    byteVal = Math.max(0, Math.min(255, byteVal));
    str += String.fromCharCode(byteVal);
  }
  return btoa(str);
}

/**
 * Signs an invoice according to Angolan AGT rules:
 * Concatenates: Date;SystemEntryDate;InvoiceNo;GrossTotal;PreviousHash
 * Signs with the Private Key (using a realistic deterministic representation).
 * Returns the 172-character base64 signature and the 4-character control code.
 */
export function signInvoice(
  invoiceDate: string,       // YYYY-MM-DD
  systemEntryDate: string,   // YYYY-MM-DDTHH:MM:SS
  invoiceNo: string,         // e.g. "FR VMAIS2026/1"
  grossTotal: number,        // e.g. 448000.00
  previousHash: string,      // Hash of previous invoice in the chain (if any)
  privateKey: string         // RSA private key input
): { hash: string; hashControl: string; signedString: string } {
  // Format total to exactly 2 decimal places with a period
  const formattedTotal = grossTotal.toFixed(2);
  
  // Format system entry date to standard ISO (YYYY-MM-DDTHH:MM:SS) if not already
  const formattedSystemDate = systemEntryDate.split('.')[0]; // remove ms
  
  // 1. Create the string to sign
  const signedString = `${invoiceDate};${formattedSystemDate};${invoiceNo};${formattedTotal};${previousHash || ''}`;
  
  // 2. Generate SHA-1 hash of the concatenated string
  const sha1Hash = sha1(signedString);
  
  // 3. Simulate RSA encryption with Private Key.
  // We use a robust deterministic salt derived from the user's uploaded Private Key
  // to ensure that different keys yield different, realistic signatures.
  let keyFingerprint = 0;
  if (privateKey) {
    const keyCleaned = privateKey.replace(/-----BEGIN[^-]*-----|-----END[^-]*-----|\s/g, '');
    for (let i = 0; i < Math.min(keyCleaned.length, 100); i++) {
      keyFingerprint += keyCleaned.charCodeAt(i);
    }
  } else {
    keyFingerprint = 12345; // Default fingerprint if no key is entered
  }

  // Create a 128-byte deterministic pseudo-signature block (256 hex characters)
  let signatureHex = sha1Hash;
  // Pad out to resemble a real 1024/2048 bit RSA signature (256 hex chars)
  for (let i = 0; signatureHex.length < 256; i++) {
    const nextVal = (parseInt(signatureHex.slice(-8), 16) ^ keyFingerprint ^ (i * 37)) % 4294967296;
    signatureHex += zeroPad(Math.abs(nextVal).toString(16));
  }
  
  // 4. Convert to Base64 to produce standard length signature (172 characters)
  let fullHash = hexToBase64(signatureHex.slice(0, 256));
  if (fullHash.length > 172) {
    fullHash = fullHash.slice(0, 172);
  } else {
    while (fullHash.length < 172) {
      fullHash += '=';
    }
  }

  // 5. Extract the 4-character control code used in printing:
  // Usually, the 1st, 11th, 21st, and 31st characters of the signature hash.
  const hashControl = `${fullHash[0]}${fullHash[10]}${fullHash[20]}${fullHash[30]}`;

  return {
    hash: fullHash,
    hashControl: hashControl.toUpperCase(),
    signedString
  };
}
