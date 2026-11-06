# SmartStock User Guide

A practical guide for store staff, administrators, and customers checking an order. Use it to find common tasks and understand what each screen shows.

> This guide describes the current SmartStock screens. Screen details may change. For a sign-in or access problem, contact your organization administrator.

## Who can use SmartStock

### Staff

Staff sign in to the internal app. They can use Dashboard, Inventory, Orders, Deliveries, Daily Sales, and Settings. Staff can receive stock and work with orders and delivery progress. Some catalog controls are limited to administrators.

### Administrators

Administrators can use the staff screens and also open Analytics, Reports & Sales, and Staff Management. They can add, edit, or remove products and manage staff accounts.

### Public customers

Customers do not sign in to check an order. They need the tracking reference supplied by the store, or a tracking link shared by the store.

## Sign in and account settings

### Sign in

1. Open SmartStock and enter your work email and password.
2. Select Continue to SmartStock.
3. If the sign-in fails, check the email and password. Ask your administrator for access or help; the sign-in screen does not provide a self-service password reset.
4. Use Show or Hide beside the password field if you need to check what you entered.

After signing in, use the navigation menu to open a screen. On a phone or narrow window, select the menu button to show the navigation.

### Profile and password

1. Open Settings from the navigation menu.
2. In Profile Info, you can update your name. Your work email is managed by an administrator.
3. In Change Password, enter your current password and the new password, then save it. If you do not know the current password, ask an administrator for help.
4. In Notifications, review the available alert preferences. Browser notifications require permission in the browser and apply to that browser.
5. In Preferences & Settings, update the available app preferences. Preferences are saved in the current browser.

Select your name/profile menu and choose Sign out when you are finished using a shared device.

## Dashboard and notifications

The Dashboard provides a summary of current store activity. Use the main menu to move between the operational pages. The notification bell in the top bar opens notifications; a highlighted indicator means there are alerts to review.

If a page reports that information could not be loaded, use its Retry button when shown. If the problem continues, contact your administrator rather than repeating a transaction that may already have been saved.

## Inventory

### Find a product

1. Open Inventory.
2. Search by product name, code, category, unit, or description.
3. Use the category filter to show Glass or Aluminum products, and the stock filter to show low-stock or healthy products.
4. Review the product code, name, category, quantity and unit, price, and product status. Scroll to load more products when needed.
5. Select Export CSV to download products matching the current filters.

### Receive stock

1. Find the product and select its Restock action.
2. Enter the quantity received, actual supplier, actual receipt date, and the receipt or purchase-order reference requested by the form.
3. Use the date shown on the receipt. SmartStock reports stock movement by UTC calendar date.
4. Review the details and submit the restock.

Restocking adds inventory and records an inbound receipt. Enter information from the actual receipt; do not estimate or invent purchase details.

### Product catalog (Administrators)

Administrators can select Add Product to create a catalog entry, or use a product's edit action to change it. Product details include its name, code, category, unit, price, stock level, low-stock level, status, and optional description. The catalog also provides a delete action. Confirm the correct product before deleting it.

Staff can view the catalog and restock products, but product creation, editing, and deletion are administrator actions.

## Orders

### Create an order

1. Open Orders and select New Order.
2. Enter the customer's name and contact number.
3. Choose Delivery or Pickup. For a delivery, enter the planned delivery date and destination address.
4. Search the product list, choose an available product, enter a quantity, and select Add. Repeat for each item. Products with no stock available cannot be selected.
5. Review the item quantities and total. Enter an initial payment only when money has actually been received; leave it blank when no payment was collected.
6. Select Create Order and check that the new order appears in the list.

### Find and review an order

Use the search field to look up a customer name, order ID, or reference. Filter by order status or date range. Select an order card to open its details. The details show the customer, items, order progress, payment summary, and reference number.

Order status describes fulfillment progress. Payment status is calculated from the payments recorded for that order. Check both separately. The screen may show statuses such as Pending, Ready for Pickup, Packed, Out for Delivery, Completed, or Cancelled, depending on the order.

### Record payment, refund, or cancellation

Open an order to see the available actions. If a balance remains, select Process Payment and enter the amount received. If money has been paid, the Refund action can record a full or partial refund with a reason. Use these actions only when the payment or refund has actually occurred.

Cancel Order asks for confirmation. Cancellation updates SmartStock's records, returns the ordered items to inventory, and records a refund of the remaining paid balance. It cannot be undone. Any cash handoff must still be completed separately; changing the record does not transfer money.

### Tracking link, receipt, and export

From Order Details, open the public tracking page, print the receipt, or use the order list's Export CSV action. Share the tracking link or reference only with the intended customer. The order list can also be searched and filtered before reviewing results.

## Deliveries

The Deliveries page is for staff and administrators. It shows delivery orders, customer contact details, destination, scheduled date, and delivery progress. It does not provide live GPS or map navigation.

1. Filter by status or choose a scheduled date. Select Clear date to remove the date filter.
2. Review the status and delivery progress on each card.
3. When the delivery is not yet complete, use the card's Mark as action to advance it to the next available step. The supported steps are Pending, In Transit, and Delivered.
4. Select Export CSV to download deliveries matching the current filters.

A delivered card is shown as complete and no longer offers a next-step action. If the scheduled date or destination is missing or incorrect, ask an administrator to review the order details.

## Daily Sales

Staff and administrators can open Daily Sales to review orders by the date they were created. The date is explicitly shown in UTC, so the selected calendar date may differ from a local-time view near midnight.

1. Choose an Order date (UTC).
2. Review gross order value, collections, refunds, net collected, and the order/payment status breakdowns when they are available.
3. Search the sales list or filter it by order status. These filters change the list; the summary totals continue to cover the selected date.
4. Select Export CSV to download the sales records for the selected date.

Gross order value excludes cancelled orders. Collection and refund totals reflect recorded payments and refunds, not a cash transfer.

## Analytics (Administrators)

Analytics summarizes sales trends, inventory movement, stock levels, and product movement. Choose a delivery-date range using a preset or a custom From and To date range. The page may also show stock checks and next-month sales estimates based on recorded history.

SmartStock Insights can provide a short summary, recommendations, and items to watch. Read the selected-date details and confidence indicator. Order analytics use delivery dates, while stock movement and policy history use UTC event dates. Estimates are planning aids, not guaranteed sales or realized revenue. Some estimates are unavailable until enough sales history has been recorded; the page explains when there is not enough history.

## Reports & Sales (Administrators)

Choose a date range for the report period. The report page provides summary figures and report sections for sales, purchases, inventory, and spending. Annual procurement spending uses recorded receipt costs; receipts without a recorded cost are shown as unpriced and are not estimated from selling prices.

Use the Export selector to choose a report, then choose PDF, XLSX, or CSV when the relevant download controls are available. Current Stock Check and stock-policy history sections have their own export controls. Select Print Report to prepare a separate report document, then use the browser's print dialog. Review the period and report type before sharing a downloaded file.

## Staff Management (Administrators)

1. Open Staff Management and select Add staff.
2. Enter the staff member's name, email, and a password, then create the account. The form requires a password of at least eight characters.
3. To change a staff member's details, select Edit. Leave Reset password blank to keep the existing password; existing passwords are never displayed.
4. To remove an account, select Delete and confirm. Deletion cannot be undone.

Give new account details to the intended staff member privately. Do not include passwords in reports, notes, or customer messages.

## Public order tracking

Customers can use the tracking link shared by the store or open the public tracker and enter the reference supplied by the store. No staff account is needed.

The tracking page shows the order's recorded status, progress, billing summary, and order items. Select the refresh control to check the latest status. The status is read from the order record when checked; it is not a live vehicle location. Customers can use Copy Link or Print when those controls are shown.

If the reference cannot be found or the information looks wrong, contact the store and provide the reference privately. Do not post a tracking link publicly.

## Good practice

- Check the customer, product, quantity, date, and amount before saving a record.
- Record only payments received and refunds actually issued. SmartStock records do not move cash.
- Treat order status and payment status as separate facts.
- Use the actual supplier, receipt date, and reference when restocking.
- Protect customer contact and address information. Share reports and tracking links only with people who need them.
- Sign out after using SmartStock on a shared device.
