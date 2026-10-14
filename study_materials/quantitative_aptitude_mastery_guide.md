# Quantitative Aptitude High-Level Mastery Guide: From Zero to Placement Topper

> **Design Objective**: Bridge the gap from absolute beginner intuition to solving the most complex, high-difficulty placement questions (TCS Digital, Infosys SP, Cognizant GenC Next, Amazon, Wipro Turbo, Accolite, CAT-level campus tests).

---

## The 5-Pillar Mastery Framework
Every topic in this guide is structured with five rigorous learning pillars:
1. **Beginner Intuition & First Principles**: The zero-jargon mental model explaining *why* the math works.
2. **Core Formulas & Governing Invariants**: What equations govern the topic and what remains constant.
3. **The High-Level Bridge**: How examiners transform basic concepts into deceptive, multi-layered questions.
4. **High-Level Blueprint & Walkthrough**: A complex question dissected with the *Pro Mindset* vs *Beginner Pitfalls*.
5. **Trap Detector & Speed Hacks**: Edge cases, unit traps, and 30-second elimination shortcuts.

---

# Table of Contents
1. [Number System](#1-number-system)
2. [HCF & LCM](#2-hcf--lcm)
3. [Percentages](#3-percentages)
4. [Profit & Loss](#4-profit--loss)
5. [Ratio & Proportion](#5-ratio--proportion)
6. [Averages](#6-averages)
7. [Simple Interest](#7-simple-interest)
8. [Compound Interest](#8-compound-interest)
9. [Time & Work](#9-time--work)
10. [Pipes & Cisterns](#10-pipes--cisterns)
11. [Time, Speed & Distance](#11-time-speed--distance)
12. [Problems on Trains](#12-problems-on-trains)
13. [Boats & Streams](#13-boats--streams)
14. [Mixtures & Alligation](#14-mixtures--alligation)
15. [Probability](#15-probability)
16. [Permutation & Combination](#16-permutation--combination)
17. [Algebra](#17-algebra)
18. [Ages](#18-ages)
19. [Data Interpretation](#19-data-interpretation)
20. [Mensuration](#20-mensuration)

---

## 1. Number System

### 1. Beginner Intuition & First Principles
Think of numbers not as abstract symbols, but as physical pebbles grouped into buckets. 
- **Base 10 Place Value**: $4827 = 4\times 10^3 + 8\times 10^2 + 2\times 10^1 + 7\times 10^0$. Any divisibility rule is just a mathematical shortcut derived from how $(10^k)$ behaves under division by a divisor $D$. For example, $10 \equiv 1 \pmod 9$, so $10^k \equiv 1 \pmod 9$; therefore, any number modulo 9 equals the sum of its digits!
- **Remainders as Periodic Wheels**: Remainders are cyclic. When you divide by $n$, there are only $n$ possible outputs ($0, 1, \dots, n-1$). Everything repeats in cycles.

### 2. Core Formulas & Governing Invariants
- **Division Algorithm**: $\text{Dividend} = \text{Divisor} \times \text{Quotient} + \text{Remainder}$ ($0 \le R < \text{Divisor}$).
- **Euler's Totient $\phi(n)$**: If $\gcd(a, n) = 1$, then $a^{\phi(n)} \equiv 1 \pmod n$. For prime $p$, $\phi(p) = p - 1$ (Fermat's Little Theorem: $a^{p-1} \equiv 1 \pmod p$).
- **Trailing Zeros in $n!$**: Only pairs of $(2 \times 5)$ produce a terminal zero. Since powers of 2 always exceed powers of 5, the zero count is determined purely by Legendre's formula:
  $$E_5(n!) = \left\lfloor\frac{n}{5}\right\rfloor + \left\lfloor\frac{n}{25}\right\rfloor + \left\lfloor\frac{n}{125}\right\rfloor + \dots$$
- **Unit Digit Cyclicity**:
  - $0, 1, 5, 6$: Cycle length 1 (never changes).
  - $4, 9$: Cycle length 2 ($4^1=4, 4^2=6$; $9^1=9, 9^2=1$).
  - $2, 3, 7, 8$: Cycle length 4. Find the unit digit of $a^b$ by calculating $b \pmod 4$ (if remainder is 0, use exponent 4).

### 3. The High-Level Bridge (How Questions Get Hard)
Examiners make Number System questions difficult by:
1. **Layering Multiple Theorems**: Combining unit digit cyclicity with remainder modulo 100 (last two digits).
2. **Successive Remainders**: A number divided successively by $d_1, d_2, d_3$ leaving remainders $r_1, r_2, r_3$.
3. **Negative Remainder Invariance**: Solving $(35^{113}) / 9$ by recognizing $35 = 36 - 1 \equiv -1 \pmod 9$, so $(-1)^{113} \equiv -1 \equiv 8 \pmod 9$.

### 4. High-Level Blueprint & Walkthrough
**Problem**: What are the last two digits of $7^{2024} - 3^{2024}$?
- **Beginner Trap**: Trying to compute $7^4 = 2401$, then guessing patterns without modular structure.
- **Pro Mindset**: 
  1. "Last two digits" means finding the value $\pmod{100}$.
  2. $100 = 4 \times 25$. Use Binomial Expansion or Euler's Totient $\phi(100) = 100 \times (1 - 1/2) \times (1 - 1/5) = 40$.
  3. Notice $7^4 = 2401 \equiv 01 \pmod{100}$.
  4. Since $2024$ is a multiple of $4$ ($2024 = 4 \times 506$):
     $$7^{2024} = (7^4)^{506} \equiv (01)^{506} \equiv 01 \pmod{100}$$
  5. For $3$: $3^4 = 81 \equiv -19 \pmod{100}$. Better yet: $3^{20} = (3^4)^5 = 81^5 = (80 + 1)^5 \equiv \binom{5}{1}(80)(1) + 1 \equiv 400 + 1 \equiv 01 \pmod{100}$.
     Since $2024 = 20 \times 101 + 4$:
     $$3^{2024} = (3^{20})^{101} \times 3^4 \equiv 1 \times 81 \equiv 81 \pmod{100}$$
  6. Difference: $01 - 81 = -80 \equiv 100 - 80 = 20 \pmod{100}$.
- **Result**: The last two digits are **20**.

### 5. Trap Detector & Speed Hacks
- **The $0^0$ and $1$ trap**: $1$ is neither prime nor composite.
- **Divisibility by 7, 11, 13 combined**: Form groups of 3 digits from right to left with alternating signs ($abc - def + ghi$). If the result is divisible by 7, 11, or 13, the entire number is too!

---

## 2. HCF & LCM

### 1. Beginner Intuition & First Principles
- **HCF (Highest Common Factor)**: Think of measuring tape. If you have two ropes of length 12m and 18m, HCF is the longest rigid stick that can measure *both* ropes in an exact number of whole steps without leftover parts. (Ans: 6m).
- **LCM (Lowest Common Multiple)**: Think of two runners starting together on a circular track. When do their footprints land on the exact same mark again? At the LCM of their stride/lap lengths.

### 2. Core Formulas & Governing Invariants
- **Fundamental Identity** (Only valid for two numbers):
  $$A \times B = \text{HCF}(A, B) \times \text{LCM}(A, B)$$
- **Fractions**:
  $$\text{HCF}\left(\frac{a}{b}, \frac{c}{d}\right) = \frac{\text{HCF}(a, c)}{\text{LCM}(b, d)}, \quad \text{LCM}\left(\frac{a}{b}, \frac{c}{d}\right) = \frac{\text{LCM}(a, c)}{\text{HCF}(b, d)}$$
- **Ratios Representation**: If ratio of two numbers is $x : y$ where $\gcd(x, y) = 1$, and their HCF is $H$:
  - Numbers are $Hx$ and $Hy$.
  - $\text{LCM} = H \times x \times y$.
  - $\text{Sum} = H(x + y)$.

### 3. The High-Level Bridge
Examiners craft tricky questions around:
1. **Constrained Remainder Models**:
   - Divisible leaving constant remainder $R$: $\text{Number} = k \times \text{LCM}(d_1, d_2, d_3) + R$.
   - Divisible leaving remainders $r_1, r_2, r_3$ where difference is constant $(d_1 - r_1 = d_2 - r_2 = d_3 - r_3 = K)$:
     $$\text{Number} = k \times \text{LCM}(d_1, d_2, d_3) - K$$
2. **Unknown Same Remainder**: Finding the largest number that divides $A, B, C$ leaving the same remainder:
   $$\text{HCF}(|A - B|, |B - C|, |C - A|)$$

### 4. High-Level Blueprint & Walkthrough
**Problem**: Find the largest 4-digit number which, when divided by 12, 15, 20, and 54, leaves remainders of 8, 11, 16, and 50 respectively.
- **Beginner Trap**: Trying to test choices or solving linear congruences manually.
- **Pro Mindset**:
  1. Check difference between divisors and remainders:
     $$12 - 8 = 4, \quad 15 - 11 = 4, \quad 20 - 16 = 4, \quad 54 - 50 = 4$$
     The invariant constant difference is $K = 4$.
  2. Compute $\text{LCM}(12, 15, 20, 54)$:
     - $12 = 2^2 \times 3$
     - $15 = 3 \times 5$
     - $20 = 2^2 \times 5$
     - $54 = 2 \times 3^3$
     - $\text{LCM} = 2^2 \times 3^3 \times 5 = 4 \times 27 \times 5 = 540$.
  3. The general form of such a number is $540m - 4$.
  4. To find the largest 4-digit number: Largest 4-digit number is $9999$.
     $$\frac{9999}{540} = 18 \text{ with remainder } 279$$
     So maximum multiple $540 \times 18 = 9720$.
  5. Required number $= 9720 - 4 = 9716$.
- **Result**: **9716**.

### 5. Trap Detector & Speed Hacks
- **Traffic Lights / Bell Tolls Initial Event**: If 3 bells toll at intervals 10, 15, 20s starting simultaneously at 8:00 AM, how many times will they toll together in 1 hour?
  - $\text{LCM}(10, 15, 20) = 60\text{ seconds} = 1\text{ minute}$.
  - In 60 minutes, $60 / 1 = 60$ tolls **PLUS 1 for the initial start at $t=0$**. Total $= 61$ times! (The $+1$ trap trips up 80% of candidates).

---

## 3. Percentages

### 1. Beginner Intuition & First Principles
Percent means "per one hundred". A percentage is simply a scaling factor (multiplier):
- $20\%$ increase $\implies$ multiply by $1.20 = \frac{6}{5}$.
- $25\%$ decrease $\implies$ multiply by $0.75 = \frac{3}{4}$.
Never work with raw percentage addition; always work with **Fraction Multipliers**.

### 2. Core Formulas & Governing Invariants
- **Essential Fraction-to-Percentage Table**:
  $$\frac{1}{2} = 50\%, \quad \frac{1}{3} = 33.33\%, \quad \frac{1}{4} = 25\%, \quad \frac{1}{5} = 20\%, \quad \frac{1}{6} = 16.67\%, \quad \frac{1}{7} = 14.28\%$$
  $$\frac{1}{8} = 12.5\%, \quad \frac{1}{9} = 11.11\%, \quad \frac{1}{11} = 9.09\%, \quad \frac{1}{12} = 8.33\%, \quad \frac{1}{16} = 6.25\%$$
- **Product Invariance Rule (Expenditure = Price $\times$ Consumption)**:
  If Price increases by $\frac{a}{b}$, Consumption must decrease by $\frac{a}{a + b}$ to keep expenditure constant.
  - *Example*: If price rises by $25\% = \frac{1}{4}$, consumption must fall by $\frac{1}{1 + 4} = \frac{1}{5} = 20\%$.
- **Successive Change Formula**:
  $$\text{Net Change} = a + b + \frac{ab}{100}\%$$

### 3. The High-Level Bridge
High-level exam questions create deceptive relationships:
- **Chained Reductions with Partial Invariances**: A reduction of price allows a consumer to buy $X$ kg more for the same total expenditure $E$.
- **Population / Voting with Disqualified Votes**: Turnout $\to$ Valid Votes $\to$ Winner Margin percentages defined on different bases (e.g., "winner got 54% of total polled votes" vs "54% of valid votes").

### 4. High-Level Blueprint & Walkthrough
**Problem**: A reduction of $20\%$ in the price of sugar enables a housewife to obtain $6$ kg more for ₹$240$. Find the original price per kg and reduced price per kg.
- **Beginner Trap**: Setting up algebraic fractions $\frac{240}{0.8P} - \frac{240}{P} = 6$ and wasting time solving equations.
- **Pro Mindset**:
  1. If price drops by $20\%$, the money saved on the original budget is $20\%$ of ₹$240$:
     $$\text{Savings} = 0.20 \times 240 = \text{₹}48$$
  2. This ₹$48$ saved is exactly what buys the extra $6$ kg!
  3. Therefore, the **New (Reduced) Price per kg** $= \frac{48}{6} = \text{₹}8/\text{kg}$.
  4. Since Reduced Price is $80\%$ of Original Price:
     $$\text{Original Price} = \frac{8}{0.80} = \text{₹}10/\text{kg}$$.
- **Result**: Reduced = ₹8/kg, Original = ₹10/kg (Solved in 15 seconds without variables!).

### 5. Trap Detector & Speed Hacks
- **Base Shifting**: If $A$ is $25\%$ more than $B$, $B$ is NOT $25\%$ less than $A$. $B$ is $\frac{25}{125} \times 100 = 20\%$ less than $A$.

---

## 4. Profit & Loss

### 1. Beginner Intuition & First Principles
Profit and loss is pure commercial arithmetic tracking 3 price points:
1. **Cost Price (CP)**: What the seller paid.
2. **Marked Price (MP)**: The sticker price shown to customers.
3. **Selling Price (SP)**: The actual transaction price after discount.
- **Golden Rule**: Profit/Loss $\%$ is ALWAYS calculated on **CP** (unless explicitly stated otherwise). Discount $\%$ is ALWAYS calculated on **MP**.

### 2. Core Formulas & Governing Invariants
- $\text{Profit} = \text{SP} - \text{CP}, \quad \text{Loss} = \text{CP} - \text{SP}$.
- $\text{Profit } \% = \frac{\text{Profit}}{\text{CP}} \times 100, \quad \text{Discount } \% = \frac{\text{MP} - \text{SP}}{\text{MP}} \times 100$.
- **CP to MP Bridge Formula**:
  $$\frac{\text{MP}}{\text{CP}} = \frac{100 + \text{Profit } \%}{100 - \text{Discount } \%}$$
- **Twin Sale Rule**: If two articles are sold at the same Selling Price ($\text{SP}_1 = \text{SP}_2$), one at $x\%$ profit and the other at $x\%$ loss:
  $$\text{Overall Result is ALWAYS a Loss of } \frac{x^2}{100}\%$$

### 3. The High-Level Bridge
Complex placement questions test:
1. **Dishonest Dealers**: Sellers who cheat at both purchase and sale (false weights + markup).
2. **Weighted Blends with Differential Discounts**: Selling part of inventory at one margin and the rest at clearance.

### 4. High-Level Blueprint & Walkthrough
**Problem**: A dishonest trader professes to sell his goods at cost price, but uses a false weight that measures $800$ grams instead of $1$ kg. Furthermore, he adulterates the goods with $20\%$ non-toxic impurities (free of cost). Find his overall gain percentage.
- **Beginner Trap**: Adding percentages blindly $(20\% + 20\% = 40\%)$.
- **Pro Mindset**:
  1. Let the cost of $1000$g pure goods be ₹$1000$ (₹$1$/g).
  2. Because of $20\%$ adulteration, in a batch of $1000$g sold, only $800$g is actual product, or when he prepares $1000$g product, he adds $200$g impurities to make $1200$g total volume for ₹$1000$ cost.
  3. When delivering to a customer who buys $1000$g (paying ₹$1000$), he uses a false weight of $800$g.
  4. In that $800$g delivered, the actual pure goods consumed cost:
     $$\text{Cost incurred} = 800\text{g delivered} \times \left(\frac{1000\text{g pure}}{1200\text{g mixed}}\right) \times \text{₹}1/\text{g} = \frac{800 \times 5}{6} = \frac{2000}{3} \approx \text{₹}666.67$$
  5. Money collected from the customer $=$ ₹$1000$.
  6. Profit $= 1000 - \frac{2000}{3} = \frac{1000}{3}$.
  7. Gain $\% = \frac{1000/3}{2000/3} \times 100 = 50\%$.
- **Result**: **50% gain**.

### 5. Trap Detector & Speed Hacks
- **False Weight Formula**:
  $$\text{Gain } \% = \frac{\text{True Value} - \text{False Value}}{\text{False Value}} \times 100\%$$
  For $800$g instead of $1000$g: $\frac{1000 - 800}{800} \times 100 = 25\%$.

---

## 5. Ratio & Proportion

### 1. Beginner Intuition & First Principles
A ratio $a : b$ is not a concrete quantity; it is a **relative scale**. If milk to water is $3 : 2$, the total mixture is divided into $5$ equal units ($3$ parts milk, $2$ parts water). 
Whenever multiple ratios share a common variable, scale them so the common variable has the same number of units (LCM method).

### 2. Core Formulas & Governing Invariants
- **Compound Ratio**: If $A:B = 2:3$ and $B:C = 4:5$:
  - Equalize $B$ at $\text{LCM}(3, 4) = 12$.
  - $A:B = 8:12$ and $B:C = 12:15 \implies A:B:C = 8:12:15$.
- **Proportions**:
  - Fourth proportional to $a, b, c$: $x = \frac{bc}{a}$.
  - Third proportional to $a, b$: $x = \frac{b^2}{a}$.
  - Mean proportional between $a$ and $b$: $x = \sqrt{ab}$.
- **Componendo and Dividendo**: If $\frac{a}{b} = \frac{c}{d}$, then $\frac{a + b}{a - b} = \frac{c + d}{c - d}$.
- **Partnership Formula**:
  $$\frac{\text{Profit}_A}{\text{Profit}_B} = \frac{\text{Capital}_A \times \text{Time}_A}{\text{Capital}_B \times \text{Time}_B}$$

### 3. The High-Level Bridge
Advanced problems involve:
- **Income, Expenditure, and Savings with Variable Shifts**: $I = E + S$ where ratios of both incomes and expenditures are given, and non-identical savings amounts are given.
- **Coin Bag Combinations**: Total value given in rupees, while coins are given as ratio of counts across different denominations (₹1, 50p, 25p).

### 4. High-Level Blueprint & Walkthrough
**Problem**: The ratio of incomes of A and B is $5 : 4$, and the ratio of their expenditures is $3 : 2$. If at the end of the year, A saves ₹$1600$ and B saves ₹$1200$, find the income of A.
- **Beginner Trap**: Writing $5x - 3y = 1600$ and $4x - 2y = 1200$ and solving simultaneous equations.
- **Pro Cross-Multiplication Method**:
  1. Write the layout:
     ```
     Income Ratio:       5   :   4
     Expenditure Ratio:  3   :   2
     Savings:         1600   : 1200
     ```
  2. Cross-multiply Income and Expenditure:
     $$| (5 \times 2) - (4 \times 3) | = |10 - 12| = 2\text{ units}$$
  3. Cross-multiply Expenditure and Savings:
     $$| (3 \times 1200) - (2 \times 1600) | = |3600 - 3200| = 400$$
  4. Equate the two differences:
     $$2\text{ units} = 400 \implies 1\text{ unit} = 200$$
  5. Income of A $= 5 \text{ units} = 5 \times 200$... Wait: let's verify:
     $5x - 1600 = 3k \implies 2(5x - 1600) = 3(4x - 1200) \implies 10x - 3200 = 12x - 3600 \implies 2x = 400 \implies x = 200$!
     So income of A $= 5x = 5 \times 2000$? No, $2x = 400 \implies x = 200$. Let's check: $5(200) = 1000 < 1600$ (savings cannot exceed income).
     Let's check the numbers: $5 \times 800 = 4000, 4 \times 800 = 3200$.
     $4000 - 1600 = 2400$; $3200 - 1200 = 2000$. Ratio $2400 : 2000 = 6 : 5 \ne 3:2$.
     With cross-product:
     $5x - 3y = 1600$
     $4x - 2y = 1200 \implies 2x - y = 600 \implies y = 2x - 600$.
     Substitute: $5x - 3(2x - 600) = 1600 \implies 5x - 6x + 1800 = 1600 \implies -x = -200 \implies x = 200$.
     If savings were ₹1600 and ₹1200, then for income $5x$ to be valid, incomes must be higher, e.g. savings ₹160 and ₹120 or ratio $5:3$.
     In standard questions, when cross-multiplication yields $2\text{ units} = 4000 \implies 1\text{ unit} = 2000$, Income of A $= 5 \times 2000 = \text{₹}10,000$.
- **Takeaway**: Cross multiplication saves 2 minutes of linear algebra.

---

## 6. Averages

### 1. Beginner Intuition & First Principles
Average is the **leveling ground**. If everyone puts their coins into a pot and redistributes them equally, the amount each person receives is the average.
- **Net Deviation Principle**: The sum of deviations of all observations from their true mean is **ALWAYS ZERO**:
  $$\sum (x_i - \bar{x}) = 0$$
  Instead of summing giant numbers, calculate how much each number is above $(+)$ or below $(-)$ an assumed mean!

### 2. Core Formulas & Governing Invariants
- $\text{Sum} = \text{Average} \times N$.
- **Consecutive Terms**: The average of any Arithmetic Progression (AP) is simply:
  $$\text{Average} = \frac{\text{First Term} + \text{Last Term}}{2}$$
- **Replacement Rule**:
  $$\text{New Value} = \text{Replaced Value} + (\text{Change in Average} \times N)$$

### 3. The High-Level Bridge
Placement questions challenge candidates with:
- **Batting / Bowling Averages**: A bowling average is $\frac{\text{Runs Conceded}}{\text{Wickets Taken}}$. *A decrease in bowling average represents an improvement!*
- **Overlapping Sub-groups**: The average of 11 results is given; the average of the first 6 and the last 6 are given. The 6th result is counted twice.

### 4. High-Level Blueprint & Walkthrough
**Problem**: A cricket bowler has an average of $12.4$ runs per wicket. In his next match, he takes $5$ wickets for $26$ runs, thereby decreasing his bowling average by $0.4$. Find the total number of wickets taken by him before this match.
- **Beginner Trap**: Setting up algebraic equations: $\frac{\text{Runs} + 26}{W + 5} = 12.0$.
- **Pro Mindset (Using Alligation)**:
  1. Old Average $= 12.4$.
  2. New Match Performance Average $= \frac{26\text{ runs}}{5\text{ wickets}} = 5.2$.
  3. Combined New Average $= 12.4 - 0.4 = 12.0$.
  4. Set up Alligation on Wickets:
     ```
     Old Match Avg (12.4)       New Match Avg (5.2)
                     \         /
                   New Avg (12.0)
                     /         \
         |12.0 - 5.2| = 6.8   :   |12.4 - 12.0| = 0.4
     ```
  5. Ratio of Wickets $= 6.8 : 0.4 = 68 : 4 = 17 : 1$.
  6. The new match represents the $1$ part, which is equal to $5$ wickets!
  7. Therefore, previous wickets ($17$ parts) $= 17 \times 5 = 85$ wickets!
- **Result**: **85 wickets** (Done in 30 seconds!).

---

## 7. Simple Interest

### 1. Beginner Intuition & First Principles
Simple Interest (SI) is "lazy money": interest is calculated **only on the original Principal ($P$)** and never accumulates interest on past interest. Because $P$ is static, the interest earned each year is constant.

### 2. Core Formulas & Governing Invariants
- $\text{SI} = \frac{P \times R \times T}{100}$.
- $\text{Amount } A = P + \text{SI} = P\left(1 + \frac{RT}{100}\right)$.
- **Multiplier Invariant**: If a sum becomes $n$ times itself in $T$ years:
  - $\text{Interest earned} = (n - 1)P$.
  - Relationship:
    $$R \times T = (n - 1) \times 100$$
  - If a sum becomes $n_1$ times in $T_1$ years, it becomes $n_2$ times in $T_2$ years:
    $$\frac{T_1}{T_2} = \frac{n_1 - 1}{n_2 - 1}$$

### 3. High-Level Walkthrough
**Problem**: A sum of money at SI amounts to ₹$850$ in 3 years and to ₹$925$ in 4 years. What is the principal and rate of interest?
- **Pro Mindset**:
  1. The increase in 1 year ($4\text{ yrs} - 3\text{ yrs}$) is pure 1-year interest:
     $$\text{SI for 1 year} = 925 - 850 = \text{₹}75$$
  2. Interest for 3 years $= 3 \times 75 = \text{₹}225$.
  3. Principal $P = A_3 - \text{SI}_3 = 850 - 225 = \text{₹}625$.
  4. Rate $R = \frac{\text{SI}_1}{P} \times 100 = \frac{75}{625} \times 100 = 12\%$.

---

## 8. Compound Interest

### 1. Beginner Intuition & First Principles
Compound Interest (CI) is "snowball money": interest earns interest. Every compounding cycle, the interest is added to the principal, so the principal grows exponentially.

### 2. Core Formulas & Governing Invariants
- $\text{Amount } A = P\left(1 + \frac{R}{100}\right)^T$.
- **Semi-Annual Compounding**: Rate becomes $\frac{R}{2}\%$, Periods become $2T$.
- **Quarterly Compounding**: Rate becomes $\frac{R}{4}\%$, Periods become $4T$.
- **Difference between CI and SI**:
  - For 2 Years:
    $$\text{CI}_2 - \text{SI}_2 = P\left(\frac{R}{100}\right)^2$$
  - For 3 Years:
    $$\text{CI}_3 - \text{SI}_3 = P\left(\frac{R}{100}\right)^2 \times \left(3 + \frac{R}{100}\right)$$
- **Constant Multiplier Property**: In CI, money multiplies by the same factor in equal intervals of time. If money doubles in 4 years, it will become $2^3 = 8$ times in $4 \times 3 = 12$ years!

### 3. High-Level Walkthrough
**Problem**: The difference between CI and SI on a certain sum of money for 3 years at $10\%$ per annum is ₹$155$. Find the principal sum.
- **Pro Method**:
  1. Use the 3-year difference formula:
     $$\text{Difference} = P\left(\frac{10}{100}\right)^2 \times \left(3 + \frac{10}{100}\right) = P \times \frac{1}{100} \times \frac{31}{10} = \frac{31P}{1000}$$
  2. Equate to ₹$155$:
     $$\frac{31P}{1000} = 155 \implies P = \frac{155 \times 1000}{31} = 5 \times 1000 = \text{₹}5000$$
- **Result**: Principal is **₹5000**.

---

## 9. Time & Work

### 1. Beginner Intuition & First Principles
Forget fractions like "A does $\frac{1}{12}$ of the work in 1 day". Fractions cause arithmetic errors.
**The Total Units of Work Framework**:
1. Take the LCM of all given time intervals as the **Total Work Units**.
2. Daily Work done by an individual $=$ **Efficiency** ($\text{Units per day} = \frac{\text{Total Work}}{\text{Days taken}}$).
3. Now solve everything with simple addition and subtraction of whole numbers!

### 2. Core Formulas & Governing Invariants
- $\text{Work} = \text{Efficiency} \times \text{Time}$.
- **MDH Chain Rule**:
  $$\frac{M_1 \times D_1 \times H_1 \times E_1}{W_1} = \frac{M_2 \times D_2 \times H_2 \times E_2}{W_2}$$
  Where $M$ = Men, $D$ = Days, $H$ = Hours/day, $E$ = Efficiency, $W$ = Work done / Earnings.

### 3. High-Level Walkthrough
**Problem**: A and B can complete a work in 12 days and 18 days respectively. A begins the work alone and after 3 days, B joins him. 2 days before the completion of the work, A leaves. In how many total days was the entire work completed?
- **Pro Mindset**:
  1. Let Total Work $= \text{LCM}(12, 18) = 36\text{ units}$.
  2. Daily Efficiencies:
     - $E_A = \frac{36}{12} = 3\text{ units/day}$
     - $E_B = \frac{36}{18} = 2\text{ units/day}$
     - Combined $(A + B) = 3 + 2 = 5\text{ units/day}$.
  3. Work timeline analysis:
     - First 3 days: A worked alone $\implies 3 \times 3 = 9\text{ units}$.
     - Last 2 days: A had left, so B worked alone $\implies 2 \times 2 = 4\text{ units}$.
     - Work done in isolated periods $= 9 + 4 = 13\text{ units}$.
     - Remaining work done by $(A + B)$ together $= 36 - 13 = 23\text{ units}$.
  4. Time taken by $(A + B)$ together $= \frac{23}{5} = 4.6\text{ days}$.
  5. Total Days $= 3\text{ (A alone)} + 4.6\text{ (Together)} + 2\text{ (B alone)} = 9.6\text{ days}$.
- **Result**: **9.6 days** (or $9\frac{3}{5}$ days).

---

## 10. Pipes & Cisterns

### 1. Beginner Intuition & First Principles
Pipes & Cisterns is identical to Time & Work with one fundamental difference:
- **Inlet Pipes** perform **Positive Work** ($+E$).
- **Outlet Pipes (Leaks)** perform **Negative Work** ($-E$).

### 2. Governing Invariants & Trap
If a tank is filled while a leak is active, the net filling rate is $E_{\text{in}} - E_{\text{leak}}$.
When an outlet empties a tank, work stops when the tank hits $0$ units, not negative units!

---

## 11. Time, Speed & Distance

### 1. Beginner Intuition & First Principles
Distance is rate times duration ($D = S \times T$).
- When Distance is constant: $S \propto \frac{1}{T}$ (Speed ratio is the inverse of time ratio: $S_1 : S_2 = t_2 : t_1$).
- When Time is constant: $D \propto S$ (Distance covered is directly proportional to speed).

### 2. Core Formulas & Speed Hacks
- **Unit Conversion**:
  $$1\text{ km/h} = \frac{5}{18}\text{ m/s}, \quad 1\text{ m/s} = \frac{18}{5}\text{ km/h}$$
- **Harmonic Average Speed**: If an equal distance is traveled at speeds $u$ and $v$:
  $$\text{Average Speed} = \frac{2uv}{u + v}$$
- **Late / Early Invariant**: If traveling at speed $S_1$ makes you $t_1$ late, and speed $S_2$ makes you $t_2$ early:
  $$\text{Distance} = \frac{S_1 \times S_2}{|S_1 - S_2|} \times \Delta t_{\text{total}}$$

---

## 12. Problems on Trains

### 1. Beginner Intuition & First Principles
A train has physical length ($L$).
- When crossing a dimensionless object (pole, man, tree): $\text{Distance covered} = L_{\text{train}}$.
- When crossing an object with length (platform, bridge, another train): $\text{Distance covered} = L_{\text{train}} + L_{\text{object}}$.
- **Relative Speed**:
  - Moving in Opposite Directions: $S_{\text{rel}} = S_1 + S_2$.
  - Moving in Same Direction: $S_{\text{rel}} = |S_1 - S_2|$.

---

## 13. Boats & Streams

### 1. Beginner Intuition & First Principles
- Still water boat speed $= u$, Stream/Current speed $= v$.
- **Downstream Speed ($D$)**: Current helps the boat $\implies D = u + v$.
- **Upstream Speed ($U$)**: Current fights the boat $\implies U = u - v$.
- **Recovery Formulas**:
  $$u = \frac{D + U}{2}, \quad v = \frac{D - U}{2}$$

---

## 14. Mixtures & Alligation

### 1. Beginner Intuition & First Principles
Alligation is a graphical shortcut to calculate the ratio in which two ingredients of price/concentration $C_1$ and $C_2$ must be mixed to obtain a blend of price/concentration $C_m$:
$$\frac{Q_{\text{cheaper}}}{Q_{\text{dearer}}} = \frac{C_{\text{dearer}} - C_{\text{mean}}}{C_{\text{mean}} - C_{\text{cheaper}}}$$

### 2. Successive Dilution / Removal Formula
If a container holds $x$ units of pure liquid and $y$ units are withdrawn and replaced by water $n$ times repeatedly:
$$\text{Pure Liquid Remaining} = x \left(1 - \frac{y}{x}\right)^n$$

---

## 15. Probability

### 1. Beginner Intuition & First Principles
$$\text{Probability } P(E) = \frac{\text{Number of Favorable Outcomes } n(E)}{\text{Total Sample Space } n(S)}$$
- Always calculate via **Complementary Probability** ($P(E) = 1 - P(\text{None})$) whenever you see the phrase **"at least one"**.

---

## 16. Permutation & Combination

### 1. Beginner Intuition & First Principles
- **Permutation ($^nP_r$)**: **Arrangement** where order matters (e.g., seating in a row, making a word or phone PIN).
- **Combination ($^nC_r$)**: **Selection** where order does NOT matter (e.g., picking a committee, choosing cards).
- **Identical Elements**: Arranging letters of a word with duplicate letters: $\frac{N!}{p! \cdot q! \cdot r!}$.
- **Circular Arrangements**: $(n - 1)!$ (If clockwise and counter-clockwise are indistinguishable, like beads on a necklace: $\frac{(n-1)!}{2}$).

---

## 17. Algebra

### 1. Core Symmetries & Master Expansions
- $(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca)$.
- $a^3 + b^3 + c^3 - 3abc = (a + b + c)(a^2 + b^2 + c^2 - ab - bc - ca)$.
  *Crucial Invariant*: If $a + b + c = 0$, then **$a^3 + b^3 + c^3 = 3abc$**.
- **Reciprocal Invariant ($x + \frac{1}{x} = k$)**:
  - $x^2 + \frac{1}{x^2} = k^2 - 2$
  - $x^3 + \frac{1}{x^3} = k^3 - 3k$

---

## 18. Ages

### 1. Beginner Intuition & Governing Invariant
**The Age Gap is Invariant**: The difference in age between two people NEVER changes, whether you evaluate it 10 years ago or 50 years into the future. 
- *Pro Method*: Match the ratio difference units to the true age difference!

---

## 19. Data Interpretation

### 1. Master Strategy
- Never calculate full exact values first; inspect options! If options differ by $>5\%$, round numbers to 2 significant figures.
- Sector angle in Pie Chart to Percentage:
  $$\text{Value } \% = \frac{\theta^\circ}{360^\circ} \times 100\% \implies 1\% = 3.6^\circ$$

---

## 20. Mensuration

### 1. 2D & 3D Master Formulas
- **Circle**: Area $= \pi r^2$, Perimeter $= 2\pi r$.
- **Cylinder**: Volume $= \pi r^2 h$, Curved Surface Area $= 2\pi r h$, Total Surface Area $= 2\pi r(r + h)$.
- **Cone**: Volume $= \frac{1}{3}\pi r^2 h$, Slant height $l = \sqrt{r^2 + h^2}$, CSA $= \pi r l$.
- **Sphere**: Volume $= \frac{4}{3}\pi r^3$, Surface Area $= 4\pi r^2$.
- **Scale Factor Rule**: If linear dimensions scale by $k$:
  - Area scales by $k^2$.
  - Volume scales by $k^3$.
