// prints on the page and in the console
const out = document.getElementById("output");

function print(...parts) {
  const line = parts.join(" ");
  console.log(line);
  out.textContent += line + "\n";
}

class Account {
  #balance = 0;
  #history = [];
  static totalAccounts = 1000;

  constructor(owner, openingAmount = 0) {
    this.owner = owner;
    this.accNo = ++Account.totalAccounts;
    if (openingAmount > 0) {
      this.#balance = openingAmount;
      this.#log("OPEN", openingAmount);
    }
  }

  // only the class itself can touch these
  #log(type, amount) {
    this.#history.push({ type, amount, balanceAfter: this.#balance });
  }

  get balance() {
    return this.#balance;
  }

  deposit(amt) {
    if (!(amt > 0)) {
      throw new Error("Deposit must be more than 0");
    }
    this.#balance += amt;
    this.#log("DEPOSIT", amt);
    return this;
  }

  // subclasses can change how much you are allowed to withdraw
  withdrawLimit() {
    return this.#balance;
  }

  withdraw(amt) {
    if (!(amt > 0)) {
      throw new Error("Withdraw amount must be more than 0");
    }
    if (amt > this.withdrawLimit()) {
      throw new Error(`Cannot withdraw ${amt}, limit is ${this.withdrawLimit()}`);
    }
    this.#balance -= amt;
    this.#log("WITHDRAW", amt);
    return this;
  }

  statement() {
    let text = `--- ${this.describe()} ---\n`;
    this.#history.forEach((h, i) => {
      text += `${i + 1}. ${h.type.padEnd(8)} ${String(h.amount).padStart(6)}  => ${h.balanceAfter}\n`;
    });
    return text;
  }

  describe() {
    return `Account #${this.accNo} (${this.owner}) - Regular`;
  }
}

class SavingsAccount extends Account {
  constructor(owner, openingAmount, ratePercent) {
    super(owner, openingAmount);
    this.ratePercent = ratePercent;
  }

  addInterest() {
    const interest = (this.balance * this.ratePercent) / 100;
    this.deposit(interest);
    return interest;
  }

  describe() {
    return `Account #${this.accNo} (${this.owner}) - Savings @ ${this.ratePercent}%`;
  }
}

class CurrentAccount extends Account {
  constructor(owner, openingAmount, overdraft = 5000) {
    super(owner, openingAmount);
    this.overdraft = overdraft;
  }

  // overdraft lets this account go below zero
  withdrawLimit() {
    return this.balance + this.overdraft;
  }

  describe() {
    return `Account #${this.accNo} (${this.owner}) - Current, overdraft ${this.overdraft}`;
  }
}

// ---------- try it out ----------

function attempt(label, fn) {
  try {
    fn();
  } catch (err) {
    print(`[${label}] failed: ${err.message}`);
  }
}

const accounts = [
  new Account("Sarvendra", 5000),
  new SavingsAccount("Manish", 12000, 8),
  new CurrentAccount("Riya", 3000, 2000),
];

const [regular, savings, current] = accounts;

regular.deposit(2000).withdraw(1000);
attempt("regular", () => regular.withdraw(99999));

savings.deposit(1000);
print("Interest added:", savings.addInterest());

current.withdraw(4000);
attempt("current", () => current.withdraw(2000));

// same call, different result per class
accounts.forEach((acc) => {
  print(acc.describe(), "| balance:", acc.balance, "| can withdraw up to:", acc.withdrawLimit());
});

print("");
print(savings.statement());

// balance can't be changed from outside
attempt("hack", () => {
  regular.balance = 1000000;
});
print("After trying to hack balance:", regular.balance);

/*
  4 pillars used here:
  Encapsulation  -> #balance, #history, #log() are private
  Inheritance    -> SavingsAccount and CurrentAccount extend Account
  Polymorphism   -> describe() and withdrawLimit() are overridden
  Abstraction    -> use deposit(), withdraw(), statement() without knowing the internals
*/