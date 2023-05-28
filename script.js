'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elvationGain) {
    super(coords, distance, duration);
    this.elvationGain = elvationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([19.57, 57.5], 7, 45, 87);
// const run2 = new Cycling([24.57, 75.5], 27, 59, 47);
// console.log(run1, run2);

//////////////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #wokout = [];
  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElavationfield.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your positons');
        }
      );
  }

  _loadMap(positon) {
    const { latitude } = positon.coords;
    const { longitude } = positon.coords;
    console.log(
      `https://www.google.com/maps/@${latitude},${longitude},12z?entry=ttu`
    );

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 12);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    // Displaying the workout form
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Clear all input field
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElavationfield() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validedInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    // Get data form user

    // If workout is running, then create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid or not
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validedInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('A number has to be positve one');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling, then create cycling  object
    if (type === 'cycling') {
      const elvation = +inputElevation.value;
      // Check if data is valid or not
      if (
        !validedInputs(distance, duration, elvation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive');

      workout = new Cycling([lat, lng], distance, duration, elvation);
    }

    // Add workout to workout array list
    this.#wokout.push(workout);
    console.log(workout);

    // Display the workout as marker on map
    this._renderWorkout(workout);

    this._renderWorkoutMarker(workout);

    //    Clearing the innput fields + hide form
    this._hideForm();

    // Displaying the map maker
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.type}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          
          
      `;

    if (workout.type === 'running')
      html += `
         
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
       `;
    if (workout.type === 'cycling')
      html += `
         <div class="workout__details">
         <span class="workout__icon">⚡️</span>
         <span class="workout__value">${workout.speed.toFixed(1)}</span>
         <span class="workout__unit">km/h</span>
       </div>
       <div class="workout__details">
         <span class="workout__icon">⛰</span>
         <span class="workout__value">${workout.elvationGain}</span>
         <span class="workout__unit">m</span>
       </div>
     </li>
         
         `;

    form.insertAdjacentHTML('afterend', html);
  }
}

const app = new App();
