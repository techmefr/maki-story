export const PALETTE = ['#FF8FC9', '#6DB5FF', '#B28DFF', '#4AD3A5', '#FFC933', '#FF7766'];
export const VOICES = ['Maman', 'Papi Serge', 'Mamie Yolande', 'Beau-papa Trésor'];
export const LANGS = {
  fr: { n: 'FR', label: 'Français', flag: 'linear-gradient(90deg,#0055A4 33%,#fff 33% 67%,#EF4135 67%)' },
  mg: { n: 'MG', label: 'Malagasy', flag: 'linear-gradient(#FC3D32 50%,#007E3A 50%) right/67% 100% no-repeat,#fff' },
  en: { n: 'EN', label: 'English', flag: 'linear-gradient(#C8102E,#C8102E) center/100% 22% no-repeat,linear-gradient(#C8102E,#C8102E) center/22% 100% no-repeat,linear-gradient(#fff,#fff) center/100% 44% no-repeat,linear-gradient(#fff,#fff) center/44% 100% no-repeat,#1D3C85' },
  es: { n: 'ES', label: 'Español', flag: 'linear-gradient(#AA151B 25%,#F1BF00 25% 75%,#AA151B 75%)' }
};
const ch = (id, name, color, voice, fr, d, rec, prev) => ({ id, name, color, voice, text: { fr }, desc: { fr: d }, rec: rec || null, review: '', comment: '', prev: prev || '' });
export const DEFAULT = {
  title: 'Le petit lémurien', langs: ['fr', 'mg'],
  pages: [
    { id: 'p1', title: { fr: 'Le réveil', mg: 'Ny fifohana' }, desc: { fr: 'Le soleil se lève sur la forêt.' }, photo: '', chars: [
      ch('c1', 'Narrateur', '#6DB5FF', 'Maman', 'Au petit matin, Koko le lémurien ouvrit un œil.', 'Voix douce et calme.', { takes: 2, secs: 7 }),
      ch('c2', 'Koko', '#FFC933', 'Beau-papa Trésor', 'Quelle belle journée pour sauter !', 'Voix joyeuse et pétillante.', { takes: 1, secs: 4 }, 'Quelle belle journée pour jouer !')] },
    { id: 'p2', title: { fr: 'La rencontre' }, desc: { fr: 'Koko croise un caméléon timide.' }, photo: '', chars: [
      ch('c3', 'Narrateur', '#6DB5FF', 'Maman', 'Sur une branche, quelque chose bougeait doucement.', 'Voix mystérieuse, plus lente.', { takes: 1, secs: 6 }),
      ch('c4', 'Caméléon', '#4AD3A5', 'Papi Serge', 'Chut… ne me regarde pas…', 'Voix toute petite, hésitante.')] },
    { id: 'p3', title: { fr: 'Le grand saut' }, desc: { fr: 'Les deux amis sautent ensemble.' }, photo: '', chars: [
      ch('c5', 'Koko', '#FFC933', 'Beau-papa Trésor', 'Un, deux, trois… on saute !', 'Voix pleine d’énergie.'),
      ch('c6', 'Caméléon', '#4AD3A5', 'Papi Serge', 'D’accord… mais tiens-moi fort.', 'Voix qui prend confiance.')] }
  ]
};
const K = 'tantara_studio_v1';
export function loadBook() { try { const b = JSON.parse(localStorage.getItem(K)); if (b && b.pages) return b; } catch (e) {} return JSON.parse(JSON.stringify(DEFAULT)); }
export function saveBook(b) { try { localStorage.setItem(K, JSON.stringify(b)); } catch (e) {} }
