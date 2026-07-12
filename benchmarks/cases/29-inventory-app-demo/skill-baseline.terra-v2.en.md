# Prototype Equipment-Inventory App: One-Month Trial Proposal

## 1. Why we are proposing this

Today, equipment at our four sites is managed in separate Excel workbooks. At the end of each month, General Affairs combines those files into one record. This takes about six hours every month.

The work is time-consuming, but the larger issue is reliability. Item names are not always consistent, and updates can be missed. In the last physical count, there were 37 differences between the records and the actual inventory.

We built a prototype to test whether a shared, scan-based inventory process can reduce that manual consolidation work and make inventory status easier to trust.

## 2. What the prototype manages

Each equipment record contains the information needed for day-to-day inventory control:

- Asset number
- Item name
- Site
- Storage location
- Condition
- Last verification date

The app lets users filter records by site and see items that have not yet been verified. This gives the team a focused list for inventory work instead of requiring them to review every item manually.

It also keeps a history of each update: who changed the record, when they changed it, and the values before and after the change. That history is intended to make follow-up easier when a record and a physical item do not match.

## 3. How it would be used

The main workflow is designed for equipment checks on site.

A user opens the app on a smartphone, scans the QR code attached to an asset, and then updates its condition or storage location. The record is updated immediately, and its verification status reflects that the item has been checked.

The goal is not to add another administrative step. It is to make the physical check itself create the inventory update, so that the record is refreshed when the equipment is actually confirmed.

## 4. Live demonstration

I will now demonstrate the intended workflow.

First, I will open the list of items that have not yet been verified and filter it to the relevant site. This list is the starting point for a site inventory check.

Next, I will scan the QR code for one item with the smartphone. The app opens that item’s record using its asset number.

I will change the storage location, because the item has been moved. After saving the update, we can confirm the revised location and the last verification date.

Finally, I will return to the unverified list. The item has disappeared from that list because it has now been verified.

If we open the update history, we can also see who made the change, when it was made, and the old and new storage locations. This is the record we would use if a later question arises about where the item was moved.

## 5. What this prototype does—and does not—prove

This is an inventory-management prototype, not a replacement for every equipment-related process.

It does not handle purchase requests, depreciation, or integration with the external accounting system. Those functions are outside the scope of this trial.

The prototype currently contains only 30 sample records, and performance testing has not yet been done. We therefore should not assume that it is ready for broad deployment. The purpose of the trial is to learn whether the workflow is useful with real equipment data and a larger number of records.

## 6. Proposed one-month trial

We propose a one-month trial covering about 500 items on the head-office floor.

During the trial, we will record four measures:

- Time required to register equipment data
- Time required for the inventory count
- Number of discrepancies between records and physical inventory
- Questions raised by users during the process

These measures will tell us whether the app reduces the practical burden of inventory work, whether it improves record accuracy, and which parts of the workflow need revision before any wider decision.

## 7. Request to General Affairs

We are asking General Affairs to approve cooperation with this one-month trial and to appoint one person to prepare the equipment data for the head-office items.

That person’s support will allow us to begin with usable records and measure the registration effort accurately. General Affairs’ feedback during the trial will also be essential, because the aim is to improve the process that the team actually performs—not simply to demonstrate a new tool.

At the end of the month, we will review the recorded results together and decide whether the prototype should be refined, extended, or stopped.