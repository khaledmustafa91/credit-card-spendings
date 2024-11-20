const spendingData =
  JSON.parse(localStorage.getItem("spendings"))?.map((item) => ({
    ...item,
    purchaseDate: new Date(item.purchaseDate),
    settlementDate: new Date(item.settlementDate),
  })) || [];

// Handle form submission
document.getElementById("spendingForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value;
  const purchaseDate = new Date(document.getElementById("purchaseDate").value);

  const settlementDate = calculateSettlementDate(purchaseDate);

  // Add the new purchase
  spendingData.push({ amount, description, purchaseDate, settlementDate });
  localStorage.setItem("spendings", JSON.stringify(spendingData));

  // Reset form
  document.getElementById("spendingForm").reset();

  // Update UI
  displayResults();
  displayPurchases();
});

function saveSpending(amount, description, purchaseDate, settlementDate) {
  db.collection("spendings")
    .add({
      amount,
      description,
      purchaseDate: purchaseDate.toISOString(),
      settlementDate: settlementDate.toISOString(),
    })
    .then(() => {
      console.log("Spending added to Firestore!");
      loadSpendings(); // Refresh the list
    })
    .catch((error) => console.error("Error adding spending:", error));
}

function loadSpendings() {
  db.collection("spendings")
    .get()
    .then((querySnapshot) => {
      spendingData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        purchaseDate: new Date(doc.data().purchaseDate),
        settlementDate: new Date(doc.data().settlementDate),
      }));
      displayResults();
      displayPurchases();
    })
    .catch((error) => console.error("Error fetching spendings:", error));
}

function deleteSpending(id) {
  db.collection("spendings")
    .doc(id)
    .delete()
    .then(() => {
      console.log("Spending deleted!");
      loadSpendings(); // Refresh the list
    })
    .catch((error) => console.error("Error deleting spending:", error));
}

// Calculate the settlement date
function calculateSettlementDate(purchaseDate) {
  const month = purchaseDate.getMonth();
  const year = purchaseDate.getFullYear();

  if (purchaseDate.getDate() > 10) {
    const settlementMonth = (month + 2) % 12;
    const settlementYear = month + 2 > 11 ? year + 1 : year;
    return new Date(settlementYear, settlementMonth, 5);
  }

  const settlementMonth = (month + 1) % 12;
  const settlementYear = month + 1 > 11 ? year + 1 : year;
  return new Date(settlementYear, settlementMonth, 5);
}

// Display totals grouped by settlement month
function displayResults() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<h2>Monthly Totals</h2>";

  const grouped = spendingData.reduce((acc, { amount, settlementDate }) => {
    const monthKey = settlementDate.toISOString().slice(0, 7); // YYYY-MM
    acc[monthKey] = (acc[monthKey] || 0) + amount;
    return acc;
  }, {});

  Object.entries(grouped).forEach(([month, total]) => {
    const div = document.createElement("div");
    div.textContent = `Month: ${month}, Total: ${total}`;
    resultsDiv.appendChild(div);
  });
}

// Display all purchases
function displayPurchases() {
  const purchasesDiv = document.getElementById("purchases");
  purchasesDiv.innerHTML = "<h2>All Purchases</h2>";

  spendingData.forEach(
    ({ amount, description, purchaseDate, settlementDate }, index) => {
      const div = document.createElement("div");
      div.innerHTML = `
            <strong>Purchase #${index + 1}</strong><br>
            Amount: ${amount.toFixed(2)}<br>
            Description: ${description}<br>
            Purchase Date: ${new Date(purchaseDate).toLocaleDateString()}<br>
            Settlement Date: ${new Date(
              settlementDate
            ).toLocaleDateString()}<br>
            <button onclick="deletePurchase(${index})">Delete</button>
            <hr>
        `;
      purchasesDiv.appendChild(div);
    }
  );
}

// Delete a purchase
function deletePurchase(index) {
  spendingData.splice(index, 1);
  localStorage.setItem("spendings", JSON.stringify(spendingData));
  displayResults();
  displayPurchases();
}

// Initialize the UI
displayResults();
displayPurchases();
