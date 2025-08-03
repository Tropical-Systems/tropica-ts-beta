# 🌴 Tropica v1.4 - The Evolution Begins!

Welcome to **Tropica v1.4** - our most refined and powerful version yet! This update is packed with exciting new features, polished functionality, and some game-changing enhancements across the board. Whether you’re a server admin, designer, or user, this changelog will walk you through everything new, improved, and essential in Tropica.

To make things super clear, we’ve broken changes down by module: **Miscellaneous, Infraction, Order, Review**, and **Staff**.

---

## 🛠️ Miscellaneous Improvements

### 🔹 Info

Basic details about the bot remain accessible and streamlined.

### 🔹 Config - Now More Customizable Than Ever!

- **Embed Color**
  Bring personality to your server’s interactions! You can now set custom embed colors using HEX codes (`#000000` or `000000`). Incorrect formats will be rejected automatically.

- **Banner URL**
  Add a custom banner from any valid image link! Tropica validates your link using an HTTP check—no broken images allowed.

- **Tax Percentage**
  Set server tax rates from **0 to 100**. You can even add a `%`—we’ll filter it out for you. _(Default remains at 30% to balance Roblox taxation.)_

- **Role Update: Orderlog ➜ Designer**
  We’ve unified role requirements across modules by replacing the "orderlog" role with a standardized **designer** role for a cleaner and more consistent experience.

---

## 🚨 Infraction Module - Discipline Reimagined

### 🔸 `infraction create` _(formerly `infract add`)_

- **New:** `Appealable` status
- **Updated:** `Reason` is now a required field

### 🔸 `infraction history` _(new)_

- View the **10 most recent infractions** of any user. Clarity and accountability at your fingertips.

### 🔸 `infraction search`, `infraction void`

- No changes, rock-solid as always.

## 🧾 Order Module – Now Smarter & More Informative

### 🔸 `order prepare`

Designers must now input an **estimated duration** for order completion using formats like `1d`, `2w`, etc.

### 🔸 `order start`

Customers now receive **start notifications via DM** (when possible), along with a public update in the preparation channel.

### 🔸 `order update`

- Choose from: `In Progress`, `On Hold`, `Delayed`, or `Canceled`.
- If `Canceled` is selected, a **reason is required**.
- Add **optional extra time** using the same duration format as above.

### 🔸 NEW Commands!

- **`order active`** – View all currently active (non-canceled) orders.
- **`order search`** – Search any order using its ID.
- **`order void`** – Allows server admins (or proper roles) to void an order by ID.

### 🔸 `order complete`, `order log`

- No changes, still working like a charm.

## ⭐ Review Module – Better Feedback, Better Designs

### 🔸 NEW: `review average`

- Check the **average server rating** — accessible by all message senders.

### 🔸 NEW: `review designer-average`

- See how individual designers are performing. Full transparency for clients and admins alike.

### 🔸 `review create`

- Now lets you **optionally link an order ID** for better traceability.

### 🔸 `review void`

- Void reviews using their ID. You’ll be prompted for a reason, and the reviewer is notified via DM with details.

## 🧑‍💼 Staff Module – No Surprises, Just Smoother Operations

### 🔸 `staff promote` & `staff demote`

- Same commands, now smarter: Tropica will **automatically update user roles** if possible.
- If unable, you’ll receive a notice to **apply the changes manually**.

# 🎉 Ready to Dive In?

Tropica v1.4 is our biggest leap forward yet — more organized, more responsive, and more intuitive than ever. Thank you for being part of the journey.
