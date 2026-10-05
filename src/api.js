// طبقة البيانات: Firebase Auth + Firestore (نفس هيكل المجموعات في firestore.rules)
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import {
  getFirestore, collection, doc, query, where, limit, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, runTransaction, getCountFromServer
} from 'firebase/firestore';

const e = import.meta.env;
export const configured = !!(e.VITE_FIREBASE_API_KEY && e.VITE_FIREBASE_PROJECT_ID);
const app = configured ? initializeApp({
  apiKey: e.VITE_FIREBASE_API_KEY, authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: e.VITE_FIREBASE_PROJECT_ID, appId: e.VITE_FIREBASE_APP_ID
}) : null;
const auth = app && getAuth(app);
const db = app && getFirestore(app);

const toList = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
const newer = (a, b) => (a.created_at < b.created_at ? 1 : -1);
const now = () => new Date().toISOString();
const me = () => auth.currentUser.uid;
const toUser = (u) => (u ? { id: u.uid, email: u.email } : null);

export const onUser = (cb) => onAuthStateChanged(auth, (u) => cb(toUser(u)));
export async function signUp(email, pw) {
  const c = await createUserWithEmailAndPassword(auth, email, pw);
  try { await setDoc(doc(db, 'profiles', c.user.uid), { created_at: now() }); } catch {}
}
export const signIn = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export const signOut = () => fbSignOut(auth);

export async function items(f = {}) {
  const s = await getDocs(query(collection(db, 'items'), where('status', '==', 'available'), limit(200)));
  const list = toList(s).filter((i) =>
    (!f.category || i.category === f.category) &&
    (!f.city || String(i.city).includes(f.city)) &&
    (!f.q || String(i.name).includes(f.q))).sort(newer);
  return f.limit ? list.slice(0, f.limit) : list;
}
export const addItem = (o) => addDoc(collection(db, 'items'), { owner_id: me(), status: 'available', created_at: now(), ...o });

export async function myItems() {
  const [a, b] = await Promise.all([
    getDocs(query(collection(db, 'items'), where('owner_id', '==', me()))),
    getDocs(query(collection(db, 'requests'), where('item_owner_id', '==', me())))
  ]);
  const rs = toList(b);
  return toList(a).map((i) => ({ ...i, requests: rs.filter((r) => r.item_id === i.id) })).sort(newer);
}
export async function deleteItem(id) {
  const rs = await getDocs(query(collection(db, 'requests'), where('item_owner_id', '==', me()), where('item_id', '==', id)));
  await deleteDoc(doc(db, 'items', id));
  await Promise.all(rs.docs.map((d) => deleteDoc(d.ref)));
}

export async function request({ item, message, contact }) {
  const dup = await getDocs(query(collection(db, 'requests'),
    where('requester_id', '==', me()), where('item_id', '==', item.id), where('status', '==', 'pending')));
  if (!dup.empty) throw new Error('duplicate');
  await addDoc(collection(db, 'requests'), {
    item_id: item.id, item_owner_id: item.owner_id, item_name: item.name, item_city: item.city,
    item_category: item.category, requester_id: me(), message, requester_contact: contact,
    owner_contact: null, status: 'pending', created_at: now()
  });
}
export async function myRequests() {
  const s = await getDocs(query(collection(db, 'requests'), where('requester_id', '==', me())));
  return toList(s).sort(newer);
}
export async function decide(r, status, contact) {
  await updateDoc(doc(db, 'requests', r.id), { status, owner_contact: contact || null });
  if (status !== 'approved') return;
  await updateDoc(doc(db, 'items', r.item_id), { status: 'lent' });
  try {
    const ref = doc(db, 'stats', 'global');
    await runTransaction(db, async (t) => {
      const s = await t.get(ref);
      if (s.exists()) t.update(ref, { loans: s.data().loans + 1 }); else t.set(ref, { loans: 1 });
    });
  } catch {}
  const others = await getDocs(query(collection(db, 'requests'),
    where('item_owner_id', '==', me()), where('item_id', '==', r.item_id), where('status', '==', 'pending')));
  await Promise.all(others.docs.map((d) => updateDoc(d.ref, { status: 'rejected' })));
}
export async function returned(r) {
  await updateDoc(doc(db, 'requests', r.id), { status: 'returned' });
  await updateDoc(doc(db, 'items', r.item_id), { status: 'available' });
}
export async function stats() {
  const [a, b, c] = await Promise.all([
    getCountFromServer(query(collection(db, 'items'), where('status', '==', 'available'))),
    getDoc(doc(db, 'stats', 'global')),
    getCountFromServer(collection(db, 'profiles'))
  ]);
  return { items: a.data().count, loans: b.exists() ? b.data().loans : 0, users: c.data().count };
}
