import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"


import { onAuthStateChanged,  getAuth, updateProfile, sendEmailVerification, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"


import {
  writeBatch,
  doc,
  Timestamp,
  collection,
  addDoc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc,
  limit,
  getFirestore, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

const useUserStore = ()=>({userData})

const firebaseConfig = await fetch('./env.json').then(data=>data.json());

const firebaseApp = initializeApp(firebaseConfig)
const database = getFirestore(firebaseApp)
const firestoreAuth = getAuth()

export const register = async ({
  email,
  password
})=>{
  return await createUserWithEmailAndPassword(getAuth(), email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return userCredential
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      return error
    });
}

export const login = async ({
  email, password
})=>{
  return await signInWithEmailAndPassword(getAuth(), email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      return user
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(222, error)
      return { errors: [{ message: error.message}] }
    });
}

export function watchAuth(fn) {
  onAuthStateChanged(getAuth(), user => {
    fn(user)
  })
}

export function logout(onSignOut){
  signOut(getAuth()).then(() => {
    typeof onSignOut === 'function' && onSignOut()
  }).catch((error) => {
    // An error happened.
  });
}

export function getUser(){
  const auth = getAuth()
  return auth.currentUser
}

export async function addFireDoc(collectionName, data) {
  const currentUser = getUser()

  if(!currentUser.uid) return

  const newValue = {
    created: Timestamp.fromDate(new Date()),
    creator: currentUser.uid || "anonymus",
    ...removeUndefined(data)
  }

  const docRef = await addDoc(collection(database, collectionName), newValue)
  console.log("Fire created", collectionName, newValue)

  return {
    id: docRef.id,
    ...newValue
  }
}

export function getFormatedDay(date) {
  return Timestamp.fromDate(date)
}


export async function setFireDoc(collection, id, data, merge = true) {
  console.log("set data no indefined", removeUndefined(data))

  // if(exists.includes(JSON.stringify(removeUndefined(data)))) {
  //   alert('dublicated request')
  //   return
  // }

  // exists.push(JSON.stringify(removeUndefined(data)))
  // counter++

  return await setDoc(
    doc(database, collection, id),
    {
      updated: Timestamp.fromDate(new Date()),
      ...removeUndefined(data)
    },
    { merge }
  )
}

function checkWhereConditionExists(whereCond) {
  return Array.isArray(whereCond) && whereCond.length === 3
}

export async function getFireDocById(collection, id) {
  const newDoc = await getDoc(doc(database, collection, id))
  return convertDoc(newDoc)
}

export async function getFireDocs(
  collectionName,
  whereCond = null,
  queryLimit = 100,
  ordered = false
) {
  let q
  const queriesRoot = []
  queriesRoot.push(limit(queryLimit))
  if (ordered) {
    const order = orderBy("created", "desc")
    queriesRoot.push(order)
  }
  if (whereCond && Array.isArray(whereCond[0])) {
    const queries = []
    whereCond.forEach(item => {
      queries.push(where(...item))
    })
    queries.push(...queriesRoot)
    q = query(collection(database, collectionName), ...queries)
  } else if (whereCond && checkWhereConditionExists(whereCond)) {
    q = query(
      collection(database, collectionName),
      where(...whereCond),
      ...queriesRoot
    )
  } else {
    q = query(collection(database, collectionName), ...queriesRoot)
  }

  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) return []
  return convertSnapshot(querySnapshot)
}

export async function getFireSnapshot(
  collectionName,
  whereCond,
  handlers = {}
) {
  let q
  if (whereCond && Array.isArray(whereCond[0])) {
    const queries = []
    whereCond.forEach(item => {
      queries.push(where(...item))
    })
    q = query(collection(database, collectionName), ...queries)
  } else if (whereCond && checkWhereConditionExists(whereCond)) {
    q = query(collection(database, collectionName), where(...whereCond))
  } else {
    q = query(collection(database, collectionName))
  }
  const unsubscribe = onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === `added` && handlers.add) {
        handlers.add(convertDoc(change.doc))
        //console.log(`added item to ${collectionName}: `, change.doc.data())
      }
      if (change.type === `modified` && handlers.update) {
        handlers.update(convertDoc(change.doc))
        console.log(`Modified item from ${collectionName}: `, change.doc.data())
      }
      if (change.type === `removed` && handlers.delete) {
        handlers.delete(convertDoc(change.doc))
        console.log(`Removed item from ${collectionName}: `, change.doc.data())
      }
    })
  })

  return unsubscribe
}

export async function deleteFireDoc(collectionName, docId) {
  console.log("Fire deleted", docId, collectionName)

  await deleteDoc(doc(database, collectionName, docId))
}

function convertDoc(doc) {
  return {
    ...doc.data(),
    id: doc.id
  }
}

function convertSnapshot(snapshot) {
  const results = []
  snapshot.forEach(doc => {
    results.push({ id: doc.id, ...doc.data() })
  })

  return results
}

function getNewDocRef(collectionName) {
  return doc(collection(database, collectionName))
}

export function getFireUser() {
  const user = firestoreAuth.currentUser
  if (user !== null) {
    return {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      uid: user.uid
    }
  }
}

export function updateFireUser(displayName) {
  updateProfile(firestoreAuth.currentUser, {
    displayName
  })
    .then(() => {
      // Profile updated!
      // ...
    })
    .catch(error => {
      // An error occurred
      // ...
    })
}

export function sendEmail() {
  sendEmailVerification(firestoreAuth.currentUser).then(() => {
    // Email verification sent!
    // ...
  })
}
export function removeUndefined(val, removeFalsy = false) {
  return Object.keys(val).reduce((result, key) => {
    const isNumber = typeof val[key] === "number"
    const isBoolean = typeof val[key] === "boolean"
    if (val[key] || (isBoolean && !removeFalsy) || isNumber) {
      result[key] = val[key]
    }

    if (typeof val[key] === "object" && !Array.isArray(val[key])) {
      result[key] = removeUndefined(result[key])
    }

    return result
  }, {})
}

export async function batchSave(collection, items) {
  // Get a new write batch
  const batch = writeBatch(database)

  items.forEach(item => {
    const nycRef = doc(database, collection)
    batch.set(nycRef, item)
  })

  return await batch.commit()
}

export function createStringSearchMeta(txt) {
  const map = {}
  const s1 = (txt || "").toLowerCase()
  const n = 3
  for (let k = 0; k <= s1.length - n && k < 15; k++)
    map[s1.substring(k, k + n)] = true
  ;[...s1].forEach((item, index) => {
    if (index < 30 && index > 1) {
      map[s1.slice(0, index)] = true
    }
  })
  return map
}

//roles
//https://firebase.google.com/docs/firestore/solutions/role-based-access

export { database, /*functions, */ firestoreAuth }

const hasListenerSnapshot = {}

export function useSnapshotListner(snapshotKey = "") {
  const loadingDecorator = func => {
    let loading = false
    return async (...args) => {
      if (loading) return
      loading = true
      await func(...args)
    }
  }

  async function setSnapshotListner(
    collection,
    query,
    targetMap,
    mapKey,
    func
  ) {
    if (!targetMap[mapKey]) {
      targetMap[mapKey] = []
    }

    const currentKey = snapshotKey + "_" + collection + ":" + mapKey
    if (hasListenerSnapshot[currentKey]) {
      console.log("has snapshot " + currentKey)
      return
    }

    hasListenerSnapshot[currentKey] = await getFireSnapshot(
      collection,
      query,
      getCrudMethods(targetMap, mapKey)
    )

    if (func) {
      await func()
    }
  }

  async function setSnapshotListnerSorted(
    collection,
    query,
    targetMap,
    mapKey,
    func
  ) {
    if (!targetMap[mapKey]) {
      targetMap[mapKey] = []
    }
    if (hasListenerSnapshot[collection + ":" + mapKey]) return
    hasListenerSnapshot[collection + ":" + mapKey] = true

    const docs = await getFireDocs(collection, query, 100, true)
    targetMap[mapKey].push(...docs)

    const snapShotTimeQuery = [
      "created",
      ">=",
      Timestamp.fromMillis(Date.now())
    ]
    query.push(snapShotTimeQuery)

    hasListenerSnapshot[
      collection + ":" + mapKey
    ] = await getFireSnapshot(
      collection,
      query,
      getCrudMethods(targetMap, mapKey)
    )

    if (func) {
      await func()
    }
  }

  async function setSnapshotListnerArray(
    collection,
    query,
    targetArray,
    mapKey
  ) {
    if (hasListenerSnapshot[mapKey]) return

    hasListenerSnapshot[mapKey] = await getFireSnapshot(
      collection,
      query,
      getCrudMethodsArray(targetArray)
    )
  }

  return {
    setSnapshotListnerSorted: loadingDecorator(setSnapshotListnerSorted),
    setSnapshotListner: loadingDecorator(setSnapshotListner),
    setSnapshotListnerArray: loadingDecorator(setSnapshotListnerArray)
  }
}

export function getCrudMethods(targetMap, uniqueId) {
  const uuid = docId => {
    return typeof uniqueId === "function" ? uniqueId(docId) : uniqueId
  }

  return {
    add: doc => {
      if (!targetMap[uuid(doc.id)]) {
        targetMap[uuid(doc.id)] = []
      }
      targetMap[uuid(doc.id)].push(doc)
    },
    delete: doc => {
      const index = targetMap[uuid(doc.id)].findIndex(
        item => item.id === doc.id
      )
      targetMap[uuid(doc.id)].splice(index, 1)
    },
    update: doc => {
      const index = targetMap[uuid(doc.id)].findIndex(
        item => item.id === doc.id
      )
      targetMap[uuid(doc.id)].splice(index, 1, doc)
    }
  }
}

export function getCrudMethodsArray(targetArray) {
  return {
    add: doc => {
      targetArray.push(doc)
    },
    delete: doc => {
      const index = targetArray.findIndex(item => item.id === doc.id)
      targetArray.splice(index, 1)
    },
    update: doc => {
      const index = targetArray.findIndex(item => item.id === doc.id)
      targetArray.splice(index, 1, doc)
    }
  }
}
