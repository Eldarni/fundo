import pokemonData from './pokemon.json';
import fuzzysearch from 'fuzzysearch';

// CP Multiplier lookup table for levels 1-51
const CP_MULTIPLIERS = {
    1: 0.094,
    1.5: 0.135137432,
    2: 0.16639787,
    2.5: 0.192650919,
    3: 0.21573247,
    3.5: 0.236572661,
    4: 0.25572005,
    4.5: 0.273530381,
    5: 0.29024988,
    5.5: 0.306057377,
    6: 0.3210876,
    6.5: 0.335445036,
    7: 0.34921268,
    7.5: 0.362457751,
    8: 0.37523559,
    8.5: 0.387592406,
    9: 0.39956728,
    9.5: 0.411193551,
    10: 0.42250001,
    10.5: 0.432926419,
    11: 0.44310755,
    11.5: 0.4530599578,
    12: 0.46279839,
    12.5: 0.472336083,
    13: 0.48168495,
    13.5: 0.4908558,
    14: 0.49985844,
    14.5: 0.508701765,
    15: 0.51739395,
    15.5: 0.525942511,
    16: 0.53435433,
    16.5: 0.542635767,
    17: 0.55079269,
    17.5: 0.558830586,
    18: 0.56675452,
    18.5: 0.574569153,
    19: 0.58227891,
    19.5: 0.589887917,
    20: 0.59740001,
    20.5: 0.604818814,
    21: 0.61215729,
    21.5: 0.619399365,
    22: 0.62656713,
    22.5: 0.633644533,
    23: 0.64065295,
    23.5: 0.647576426,
    24: 0.65443563,
    24.5: 0.661214806,
    25: 0.667934,
    25.5: 0.674577537,
    26: 0.68116492,
    26.5: 0.687680648,
    27: 0.69414365,
    27.5: 0.700538673,
    28: 0.70688421,
    28.5: 0.713164996,
    29: 0.71939909,
    29.5: 0.725571552,
    30: 0.7317,
    30.5: 0.734741009,
    31: 0.73776948,
    31.5: 0.740785574,
    32: 0.74378943,
    32.5: 0.746781211,
    33: 0.74976104,
    33.5: 0.752729087,
    34: 0.75568551,
    34.5: 0.758630378,
    35: 0.76156384,
    35.5: 0.764486065,
    36: 0.76739717,
    36.5: 0.770297266,
    37: 0.7731865,
    37.5: 0.776064962,
    38: 0.77893275,
    38.5: 0.781790055,
    39: 0.78463697,
    39.5: 0.787473578,
    40: 0.79030001,
    40.5: 0.792803968,
    41: 0.79530001,
    41.5: 0.797803921,
    42: 0.80030001,
    42.5: 0.802803876,
    43: 0.80530001,
    43.5: 0.807803833,
    44: 0.81030001,
    44.5: 0.812803792,
    45: 0.81530001,
    45.5: 0.817803753,
    46: 0.82030001,
    46.5: 0.822803716,
    47: 0.82530001,
    47.5: 0.827803681,
    48: 0.83030001,
    48.5: 0.832803648,
    49: 0.83530001,
    49.5: 0.837803617,
    50: 0.84029999,
    50.5: 0.842803586,
    51: 0.84530001
};

// Sort the pokemon array by number
const sortedPokemon = pokemonData.sort((a, b) => a.number - b.number);

// Function to calculate CP
function calculateCP(pokemon, atkIV = 15, defIV = 15, hpIV = 15, level = 50) {
    const batk = pokemon.atk; // Base attack from Pokemon
    const bdef = pokemon.def; // Base defense from Pokemon
    const bhit = pokemon.hit; // Base HP from Pokemon

    const cpMultiplier = CP_MULTIPLIERS[level] || CP_MULTIPLIERS[50];

    const cp = Math.floor(
        Math.max(
            10,
            ((atkIV + batk) *
            Math.sqrt(defIV + bdef) *
            Math.sqrt(hpIV + bhit) *
            Math.pow(cpMultiplier, 2)) / 10
        )
    );

    return cp;
}

// Function to calculate HP
function calculateHP(pokemon, hpIV = 15, level = 40) {
    const baseHP = pokemon.hit;
    const cpMultiplier = CP_MULTIPLIERS[level] || CP_MULTIPLIERS[40];

    const hp = Math.floor((baseHP + hpIV) * cpMultiplier);
    return hp;
}

// Function to calculate days since date
function daysSince(dateString) {
    const releaseDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - releaseDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Function to check if HP is the same with 14 or 15 HP IV at a specific level
function hasSameHPAtLevel(pokemon, level) {
    const hp14 = calculateHP(pokemon, 14, level);
    const hp15 = calculateHP(pokemon, 15, level);
    return {
        same: hp14 === hp15,
        hp14,
        hp15
    };
}

// Get modal elements
const modal = document.getElementById('pokemonModal');
const modalPokemonName = document.getElementById('modalPokemonName');
const modalPokemonSprite = document.getElementById('modalPokemonSprite');
const modalPokemonStats = document.getElementById('modalPokemonStats');
const closeModal = document.getElementsByClassName('close')[0];

// Add click event to close modal
closeModal.onclick = function() {
    modal.style.display = "none";
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Function to show modal with Pokémon details
function showPokemonDetails(pokemon) {
    modalPokemonName.textContent = pokemon.name;
    modalPokemonSprite.src = `sprites/${pokemon.number}.png`;
    modalPokemonSprite.alt = pokemon.name;

    // Clear previous stats
    modalPokemonStats.innerHTML = '';

    // Add CP information
    const cpInfo = document.createElement('div');
    cpInfo.className = 'pokemon-stats';

    // Calculate fundo information
    const hp40 = hasSameHPAtLevel(pokemon, 40);
    const hp50 = hasSameHPAtLevel(pokemon, 50);
    const hp51 = hasSameHPAtLevel(pokemon, 51);

    const fundoLevels = [];
    if (hp40.same) fundoLevels.push('L40');
    if (hp50.same) fundoLevels.push('L50');
    if (hp51.same) fundoLevels.push('L51');

    // Format release date
    const releaseDate = pokemon.released ? new Date(pokemon.released) : null;
    const releaseInfo = releaseDate
        ? `RELEASED: ${releaseDate.toLocaleDateString()}
           <span class="days-ago">${Math.floor((new Date() - releaseDate) / (1000 * 60 * 60 * 24)).toLocaleString('en-GB')} days ago</span>`
        : 'RELEASED: Not Released';

    // Format shiny release date
    const shinyDate = pokemon.shiny ? new Date(pokemon.shiny) : null;
    const shinyInfo = shinyDate
        ? `SHINY RELEASED: ${shinyDate.toLocaleDateString()}
           <span class="days-ago">${Math.floor((new Date() - shinyDate) / (1000 * 60 * 60 * 24)).toLocaleString('en-GB')} days ago</span>`
        : 'SHINY RELEASED: Not Released';

    cpInfo.innerHTML = `
        <div class="pokedex-number">#${pokemon.number.toString().padStart(3, '0')}</div>
        <div class="base-stats">
            <span class="stat-value" data-tooltip="Attack">${pokemon.atk}</span>
            <span>•</span>
            <span class="stat-value" data-tooltip="Defense">${pokemon.def}</span>
            <span>•</span>
            <span class="stat-value" data-tooltip="HP">${pokemon.hit}</span>
        </div>
        <div class="stat cp-levels">
            <div style="color: var(--pokedex-light)" class="stat-value" data-tooltip="CP range from 10/10/10 to 15/15/15 IVs">CP RANGES:</div>
            <div style="color: var(--pokedex-light)">L15: ${calculateCP(pokemon, 10, 10, 10, 15)} - ${calculateCP(pokemon, 15, 15, 15, 15)}</div>
            <div style="color: var(--pokedex-light)">L20: ${calculateCP(pokemon, 10, 10, 10, 20)} - ${calculateCP(pokemon, 15, 15, 15, 20)}</div>
            <div style="color: var(--pokedex-light)">L25: ${calculateCP(pokemon, 10, 10, 10, 25)} - ${calculateCP(pokemon, 15, 15, 15, 25)}</div>
            <div style="color: var(--pokedex-light)">L30: ${calculateCP(pokemon, 10, 10, 10, 30)} - ${calculateCP(pokemon, 15, 15, 15, 30)}</div>
            <div style="color: var(--pokedex-light)">L35: ${calculateCP(pokemon, 10, 10, 10, 35)} - ${calculateCP(pokemon, 15, 15, 15, 35)}</div>
            <div style="color: var(--pokedex-light)">L40: ${calculateCP(pokemon, 10, 10, 10, 40)} - ${calculateCP(pokemon, 15, 15, 15, 40)}</div>
            <div style="color: var(--pokedex-light)">L50: ${calculateCP(pokemon, 10, 10, 10, 50)} - ${calculateCP(pokemon, 15, 15, 15, 50)}</div>
        </div>
        ${fundoLevels.length > 0 ? `<div class="stat"><span style="color: var(--pokedex-screen)">Fundo at ${fundoLevels.join(' • ')}</span></div>` : ''}
        <div class="stat">
            ${releaseInfo}
        </div>
        <div class="stat">
            ${shinyInfo}
        </div>
    `;
    modalPokemonStats.appendChild(cpInfo);

    // Show the modal
    modal.style.display = "block";
}

// Function to create a Pokemon card
function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.innerHTML = `
        <div class="pokedex-number">#${pokemon.number.toString().padStart(3, '0')}</div>
        <img class="pokemon-sprite" src="sprites/${pokemon.number}.png" alt="${pokemon.name}">
        <h3>${pokemon.name}</h3>
    `;

    // Add click event to show modal
    card.addEventListener('click', () => showPokemonDetails(pokemon));

    return card;
}

// Function to perform fuzzy search
function fuzzySearch(searchTerm, pokemon) {
    const searchLower = searchTerm.toLowerCase();
    const nameLower = pokemon.name.toLowerCase();

    // Use fuzzysearch package for more flexible matching
    return fuzzysearch(searchLower, nameLower);
}

// Function to update the Pokemon list based on search
function updatePokemonList(searchTerm = '') {
    const container = document.getElementById('pokemonList');
    container.innerHTML = ''; // Clear the container

    const filteredPokemon = sortedPokemon.filter(pokemon =>
        fuzzySearch(searchTerm, pokemon)
    );

    filteredPokemon.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        container.appendChild(card);
    });
}

// Get the search input and add event listener
const searchInput = document.getElementById('searchInput');

// Load saved search value from localStorage and apply it
const savedSearch = localStorage.getItem('pokemonSearch') || '';
searchInput.value = savedSearch;
if (savedSearch) {
    updatePokemonList(savedSearch);
}

// Add event listener for search input
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    // Save search value to localStorage
    localStorage.setItem('pokemonSearch', searchTerm);
    updatePokemonList(searchTerm);
});