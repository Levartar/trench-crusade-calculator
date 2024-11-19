# Trench Crusade Calculator
This is a simple Project Calculating dice probabilities for the Tabletop Wargame Trench Crusade. It calculates by throwing 10000 Dice and listing the outcomes.

Live @ https://www.trench-crusade-calculator.iba-guenster.de/

![grafik](https://github.com/user-attachments/assets/f544844b-f106-437e-b772-8b945bc58d66)

## Setup
### Clone and open the repo
```
git clone https://github.com/Levartar/trench-crusade-calculator.git
cd .\trench-crusade-calculator\
```
### Starting the Server
```
node .\server.js
```
the Server should now be operational under localhost:3000
### Changing the IP
open server.js and navigate to app.listen and change the IP 
```
app.listen(PORT, IP, () => {
    console.log(`Server is running at http://${IP}:${PORT}`);
});
```
