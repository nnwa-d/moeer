# مُعير (React + Vite + Firebase)

1. `npm install`
2. انسخ `.env.example` إلى `.env` وضع قيم firebaseConfig
3. في Firebase: فعّل Authentication (Email/Password) وأنشئ Firestore، ثم انشر `firestore.rules`
4. `npm run dev` للتجربة، و`npm run build` للبناء
5. للنشر: `npm i -g firebase-tools && firebase login && firebase init hosting` (المجلد: dist) ثم `firebase deploy`
