// Zentrale Konfiguration – gilt für alle Geräte, die die App von diesem Ort laden.
//
// supabaseUrl / supabaseKey:
//   Nur nötig für die Anmeldung per Handy (QR-Code) und die Fernsteuerung von einem
//   zweiten Gerät. Projekt-URL und "anon"/"publishable" Key aus Supabase → Project Settings → API.
//   Beide Werte sind öffentlich gedacht und dürfen hier stehen.
//
// Der YouTube-API-Key gehört NICHT hierher – er wird in der DJ-Konsole unter
// "Einstellungen" eingetragen und bleibt nur auf dem jeweiligen Gerät gespeichert.
window.KK_CONFIG = {
  supabaseUrl: "https://envdjwhktfgphcknsbho.supabase.co",
  supabaseKey: "sb_publishable_9YX_95S_MyoJEKhaKsFyXA_Ny8ggw_A"
};
