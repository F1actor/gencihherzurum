fetch('http://localhost:5000/api/muhabbet/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    childName: "test",
    parentName: "test parent",
    address: "test address",
    phoneNumber: "12345",
    grade: "1. Sınıfa Geçen"
  })
}).then(async res => {
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}).catch(console.error);
