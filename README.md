Rate analyzer on OpenOcean compared to 1inch fusion orders. It is necessary to take into account the gas at the current time. Profitable transactions are recorded in the database. Periodically, you need to recheck the order, once every 5-10 seconds, if it is not filled, then get the rates again and compare.
To run you need to run the command:
```sh
node compare.js
```