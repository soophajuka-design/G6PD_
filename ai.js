// ai.js

let model;

async function loadModel() {
  model = await tf.loadLayersModel('model/model.json');
}

async function predict(imageTensor) {
  let pred = model.predict(imageTensor);
  let data = await pred.data();

  return {
    normal: data[0],
    intermediate: data[1],
    deficient: data[2]
  };
}