# BYU-Pathway Worldwide Online

## WDD 330 - Web Frontend Development II

### ⛺ SleepOutside Starter Code

- This repository is the start of the SleepOutside web application project for WDD 330. The repository contains branches which are checkpoints for the team and individual assignments throughout the course.

- <https://byui-cse.github.io/wdd330-ww-course/week01/team.html>

### Prerequisites

- You must have Node installed to run the following commands.
  [WDD 330 Setup Environment](https://byui-cse.github.io/wdd330-ww-course/intro/)

### Common Workflow Commands

- `npm run lint` to run ESLint against your code to find errors.
- `npm run format` to run Prettier to automatically format your code.
- `npm run start` starts up a local server and updates on any JS or CSS/SCSS
- `npm run build` to build final files when you are ready to turn in.

---

## W03 Individual Task - Product List sort

- Course task reference: https://trello.com/c/4jn3piOm/23-product-list-sort
- Feature: sort the home-page products by name (A-Z or Z-A), price (low-high or high-low), or their original Featured order.
- The selection is stored under `so-product-sort` in localStorage and restored on reload. The control has a visible label, keyboard support, and a live status message.
- Implementation: `src/js/ProductSort.mjs`, initialized from `src/js/main.js`, with the control in `src/index.html` and styles in `src/css/style.css`.
- This is separate from the assigned dynamic product listing, header/footer, inventory, cart, checkout, and validation activities.
- Board status: the linked card is from the course's public template. Completion status on a student's own team board must be updated there.
- Implementation and documentation prepared with AI assistance; the student should review the source and complete their own learning self-assessment.

Manual checks: verify all five sort choices, numeric price ordering, stable ordering of equal-price products, persistence after reload, keyboard operation, mobile layout, and the existing Back to Top control.

_BYU-Pathway Worldwide improves lives through access to spiritually based, online affordable higher education. Its mission is to develop disciples of Jesus Christ who are leaders in their homes, the Church, and their communities._
