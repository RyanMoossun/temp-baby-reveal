// ------------------------------------------------------------------
//  Gender reveal settings: this is the only file you need to edit.
// ------------------------------------------------------------------
window.REVEAL_CONFIG = {
  // When the reveal happens. Format: "YYYY-MM-DDTHH:MM:SS".
  // Without an offset, this is read as each viewer's local time.
  // To make everyone count down to the same moment, add an offset,
  // e.g. "2026-12-01T18:00:00+00:00" (UK winter) or "-05:00" (US Eastern).
  revealAt: "2026-10-30T19:00:00+00:00",

  // The gender, encoded so it isn't readable at a glance in the source.
  //   "Ym95"     = boy
  //   "Z2lybA==" = girl
  // This is light obfuscation, not real security. Anyone determined
  // enough to decode it can.
  gender: "Z2lybA==",

  title: "Baby Divall is on the way!",
  subtitle: "Boy or girl? Find out when the clock hits zero.",

  // Optional: shown under the reveal headline. Leave as "" to hide.
  babyName: "",
};
