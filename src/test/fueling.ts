let isFueling = false;
export const simulateFueling = (client) => {
  let topic = 'detpos/device/livedata/1';
  let pricePerLiter = 3320;
  let totalPriceLimit = 10000;
  let totalLiters = 0;
  let totalPrice = 0;

  isFueling = true;

  let interval = setInterval(() => {
      let litersDispensed = 0.5; // Simulating 0.5 liters per interval
      let priceIncrement = litersDispensed * pricePerLiter;

      if (totalPrice + priceIncrement > totalPriceLimit) {
          litersDispensed = (totalPriceLimit - totalPrice) / pricePerLiter;
          totalPrice = totalPriceLimit;
      } else {
          totalPrice += priceIncrement;
      }

      totalLiters += litersDispensed;
      const message = `01L${totalLiters.toFixed(3)}P${totalPrice.toFixed(3)}`;

      client.publish(topic, message);

      if (totalPrice >= totalPriceLimit) {
          clearInterval(interval);
          isFueling = false;

          console.log('Fueling stopped and sending final message...');
          
          // 01S5000L6.25P2000T1234.567A12345
          let finalTopic = 'detpos/device/Final/1';
          let finalMessage = `01S${totalPrice.toFixed(3)}L${totalLiters.toFixed(3)}P${pricePerLiter.toFixed(3)}T1234.567A12345`;
          client.publish(finalTopic, finalMessage);

          console.log('Final data message sent...');
      }
  }, 1000);
}