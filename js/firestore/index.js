import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

const firebaseConfig = await fetch('./env.json').then(data=>data.json());

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// // Get a list of cities from your database
async function getCities() {
  const citiesCol = collection(db, 'messages');
  const citySnapshot = await getDocs(citiesCol);
  const cityList = citySnapshot.docs.map(doc => doc.data());
  console.log(cityList)
  return cityList;
}

getCities()