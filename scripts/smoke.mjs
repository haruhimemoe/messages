/**
 * @file scripts/smoke.mjs
 * @desc Imports the built package through its exports map in plain Node and loads every
 *       catalog, so a broken dist fails before publishing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { LOCALES, loadMessages, NAMESPACES } from "@haruhimemoe/messages";

for (const locale of LOCALES) {
  for (const namespace of NAMESPACES) {
    const messages = await loadMessages(locale, namespace);
    if (typeof messages[namespace] !== "object") throw new Error(`${locale}/${namespace} empty`);
  }
}
console.log(`smoke: ok (${LOCALES.length} locales, ${NAMESPACES.length} namespaces)`);
