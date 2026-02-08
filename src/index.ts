// Multi-Step Form Component for Webflow
class MultiStepForm {
  private currentStep: number = -1;
  private formData: any = {
    basicInfo: {},
    destinations: [],
    experiences: [],
    regionDestinations: {} as Record<string, string[]>,
    regionDestinationsSkip: {} as Record<string, boolean>,
    categorySkip: {} as Record<string, boolean>
  };

  private readonly REGION_NO_SPECIFIC = "I don't want to choose any specific destinations";
  private formContainer: HTMLElement | null = null;
  private triggerButton: HTMLElement | null = null;

  // Destination categories and their options
  private destinationCategories = {
    regions: [
      'Alpine Slovenia',
      'Western Slovenia (Slovenian Tuscany, Vipava Valley and Idrija)',
      'Adriatic and Karst Slovenia',
      'Lower Carniola (Dolenjska and Bela Krajina)',
      'Ljubljana and Central Slovenia',
      'Styria (Štajerska)',
      'Prekmurje'
    ],
    naturalWonders: [
      'Lake Bled', 'Lake Bohinj', 'Pokljuka', 'Triglav Lakes Valley', 'Soča Gorge', 'Lake Krn',
      'Vintgar Gorge', 'Rinka Falls', 'Lake Cerknica', 'Postojna Caves', 'Škocjan Caves',
      'Lake Jasna', 'Tolmin Gorges', 'Velika Planina', 'Virje Waterfall', 'Slavica Waterfall',
      'Križna Cave', 'Moon Bay', 'Lovrenc Lakes', 'Rakov Škocjan', 'Sečovlje Saltpans',
      'Zelenci', 'Logar Valley', 'Planica-Tamar Valley'
    ],
    cities: [
      'Ljubljana', 'Maribor', 'Koper', 'Celje', 'Ptuj', 'Škofja Loka', 'Novo Mesto', 'Bled',
      'Kranjska Gora', 'Radovljica', 'Idrija', 'Nova Gorica', 'Izola', 'Piran', 'Portorož', 'Rogaška Slatina',
      'Laško', 'Kranj', 'Kamnik', 'Velenje', 'Murska Sobota'
    ],
    castles: [
      'Ljubljana castle', 'Predjama castle', 'Bled castle', 'Celje castle', 'Otočec castle', 'Ptuj castle',
      'Strmol castle', 'Sevnica castle', 'Snežnik castle', 'Rihemberg castle', 'Brdo castle', 'Velenje castle',
      'Škofja Loka castle', 'Grad castle', 'Gewerknegg castle', 'Podsreda castle', 'Turjak castle',
      'Žužemberg castle', 'Mokrice castle', 'Brežice castle', 'Slovenska Bistrica castle'
    ],
    nationalParks: [
      'Triglav national park', 'Škocjan caves regional park', 'Notranjska regional park',
      'Kozjansko regional park', 'Logarska Dolina Landscape Park', 'Sečovlje Salina Landscape Park',
      'Strunjan Landscape Park', 'Drava Landscape Park'
    ],
    unescoSites: [
      'Idrija – The Heritage of Mercury',
      'The Works of Jože Plečnik in Ljubljana – Human-Centered Urban Design',
      'Škocjan Caves – A Monument of the Underworld'
    ]
  };

  private readonly CATEGORIES_WITH_SKIP = ['naturalWonders', 'cities', 'castles', 'nationalParks', 'unescoSites'];

  // Region -> City suggestions (badge "Recommended since you picked X")
  private regionCitySuggestions: Record<string, string> = {
    'Alpine Slovenia': 'Bled',
    'Adriatic and Karst Slovenia': 'Piran',
    'Ljubljana and Central Slovenia': 'Ljubljana',
    'Styria (Štajerska)': 'Maribor'
    // Western Slovenia, Lower Carniola, Prekmurje: no city in current list to suggest
  };

  // Optional sub-destinations per region (user can pick specific places in a selected region)
  private regionSubDestinations: Record<string, string[]> = {
    'Alpine Slovenia': [
      'Lake Bled',
      'Lake Bohinj',
      'Pokljuka Plateau',
      'Soča Gorge',
      'Lake Krn',
      'Tolmin Gorges',
      'Rinka Falls',
      'Slavica Waterfall',
      'Kozjak Waterfall',
      'Lake Jasna',
      'Zelenci',
      'Planica – Tamar Valley',
      'Mangart Saddle',
      'Velika Planina',
      'Radovljica',
      'Napoleon Bridge',
      'Outdoor Museums of the Isonzo Front',
      'Bled Castle',
      'Kranj'
    ],
    'Western Slovenia (Slovenian Tuscany, Vipava Valley and Idrija)': [
      'Wild Lake',
      'Idrija UNESCO Global Geopark',
      'Kendov Manor',
      'Gewerkenegg Castle',
      'Franja Partisan Hospital',
      'Škofja Loka medieval city',
      'Škofja Loka Castle',
      'Vipavski Križ'
    ],
    'Adriatic and Karst Slovenia': [
      'Moon Bay',
      'Sečovlje Saltpans',
      'Škocjan Caves',
      'Štanjel',
      'Lipica Stud Farm',
      'Holy Trinity Church Hrastovlje',
      'Koper',
      'Piran',
      'Izola'
    ],
    'Lower Carniola (Dolenjska and Bela Krajina)': [
      'Klevevž Natural Spa',
      'Krupa Spring',
      'Divji Potok',
      'Žužemberg Castle',
      'Otočec Castle',
      'Pleterje Charterhouse',
      'Kostanjevica na Krki',
      'Mokrice Castle'
    ],
    'Ljubljana and Central Slovenia': [
      'Ljubljana city centre',
      'Ljubljana Castle',
      'Turjak Castle',
      'Snežnik Castle',
      'Lake Cerknica',
      'Postojna Cave',
      'Postojna Castle',
      'Križna Cave',
      'Rakov Škocjan'
    ],
    'Styria (Štajerska)': [
      'Lovrenc Lakes',
      'Black Lake',
      'Celje Castle',
      'Ptuj Castle',
      'Maribor Old Town',
      'Sevnica Castle',
      'Žiče Charterhouse',
      'Podsreda Castle'
    ],
    Prekmurje: [
      'Bukovniško Lake',
      'Lendava Castle',
      'Murska Sobota Castle',
      'Grad Castle',
      'Parish Church of the Ascension',
      'Vinarium Viewing Tower'
    ]
  };

  private getRecommendedCitiesWithReason(): Map<string, string> {
    // city -> region (reason)
    const recommended = new Map<string, string>();
    for (const [region, city] of Object.entries(this.regionCitySuggestions)) {
      if (!this.formData.destinations.includes(region)) continue;
      // if multiple regions ever point to the same city, keep the first reason we encounter
      if (!recommended.has(city)) recommended.set(city, region);
    }
    return recommended;
  }

  private updateRegionDetailsSections(): void {
    if (!this.formContainer || this.currentStep !== 2) return;
    const container = this.formContainer.querySelector('#msf-region-details-container');
    if (!container) return;

    const selectedRegionsWithPlaces = this.destinationCategories.regions.filter(
      (region) =>
        this.formData.destinations.includes(region) &&
        this.regionSubDestinations[region]?.length
    );

    // Remove sections for regions that are no longer selected
    container.querySelectorAll('[data-msf-region-section]').forEach((el) => {
      const region = el.getAttribute('data-msf-region-section');
      if (!selectedRegionsWithPlaces.includes(region!)) el.remove();
    });

    // Add or update section for each selected region that has sub-destinations
    selectedRegionsWithPlaces.forEach((region) => {
      let section = Array.from(container.querySelectorAll<HTMLElement>('[data-msf-region-section]')).find(
        (el) => el.getAttribute('data-msf-region-section') === region
      );
      const skipChecked = !!this.formData.regionDestinationsSkip[region];
      if (!section) {
        section = document.createElement('div');
        section.className = 'destination-category region-destinations-section';
        section.setAttribute('data-msf-region-section', region);
        section.innerHTML = `
          <h3 class="category-title">Pick specific destinations in ${region}</h3>
          <div class="checkbox-group msf-region-places">
            <label class="checkbox-label msf-region-skip-row">
              <input type="checkbox" class="form-checkbox" data-msf-region-skip data-msf-region="${region.replace(/"/g, '&quot;')}" ${skipChecked ? 'checked' : ''} />
              <span>${this.REGION_NO_SPECIFIC}</span>
            </label>
            <div class="msf-region-places-list" style="${skipChecked ? 'display:none' : ''}"></div>
          </div>
        `;
        const listEl = section.querySelector('.msf-region-places-list');
        if (listEl) {
          this.regionSubDestinations[region].forEach((place) => {
            const selected = (this.formData.regionDestinations[region] || []).includes(place);
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-checkbox';
            input.setAttribute('data-msf-region-destination', '');
            input.dataset.msfRegion = region;
            input.dataset.msfPlace = place;
            input.checked = selected;
            const span = document.createElement('span');
            span.textContent = place;
            label.appendChild(input);
            label.appendChild(span);
            listEl.appendChild(label);
          });
        }
        container.appendChild(section);
      } else {
        const skipInput = section.querySelector<HTMLInputElement>('input[data-msf-region-skip]');
        const listEl = section.querySelector<HTMLElement>('.msf-region-places-list');
        if (skipInput) {
          skipInput.checked = skipChecked;
        }
        if (listEl) {
          listEl.style.display = skipChecked ? 'none' : '';
        }
        const selected = this.formData.regionDestinations[region] || [];
        listEl?.querySelectorAll<HTMLInputElement>('input[data-msf-region-destination]').forEach((input) => {
          input.checked = selected.includes(input.dataset.msfPlace || '');
        });
      }
    });

    // Single change listener (event delegation)
    if (!(container as any)._msfRegionListener) {
      (container as any)._msfRegionListener = true;
      container.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.matches?.('input[data-msf-region-skip]') && target.dataset.msfRegion != null) {
          this.toggleRegionDestinationsSkip(target.dataset.msfRegion, target.checked);
          return;
        }
        if (target.matches?.('input[data-msf-region-destination]') && target.dataset.msfRegion != null && target.dataset.msfPlace != null) {
          this.toggleRegionDestination(target.dataset.msfRegion, target.dataset.msfPlace);
        }
      });
    }
  }

  public toggleRegionDestinationsSkip(region: string, checked: boolean): void {
    this.formData.regionDestinationsSkip[region] = checked;
    const section = Array.from(this.formContainer?.querySelectorAll<HTMLElement>('[data-msf-region-section]') || []).find(
      (el) => el.getAttribute('data-msf-region-section') === region
    );
    if (!section) return;
    const list = section.querySelector<HTMLElement>('.msf-region-places-list');
    if (checked) {
      this.formData.regionDestinations[region] = [];
      if (list) list.style.display = 'none';
      section.querySelectorAll<HTMLInputElement>('input[data-msf-region-destination]').forEach((cb) => (cb.checked = false));
    } else {
      if (list) list.style.display = '';
    }
  }

  public toggleRegionDestination(region: string, place: string): void {
    this.formData.regionDestinationsSkip[region] = false;
    const section = Array.from(this.formContainer?.querySelectorAll<HTMLElement>('[data-msf-region-section]') || []).find(
      (el) => el.getAttribute('data-msf-region-section') === region
    );
    const skipInput = section?.querySelector<HTMLInputElement>('input[data-msf-region-skip]');
    if (skipInput) skipInput.checked = false;
    const listEl = section?.querySelector<HTMLElement>('.msf-region-places-list');
    if (listEl) listEl.style.display = '';
    if (!this.formData.regionDestinations[region]) this.formData.regionDestinations[region] = [];
    const arr = this.formData.regionDestinations[region];
    const i = arr.indexOf(place);
    if (i > -1) arr.splice(i, 1);
    else arr.push(place);
  }

  private updateStep2CityRecommendationsUI(): void {
    // Update only the city badges/highlights without re-rendering the whole step (prevents flicker).
    if (!this.formContainer) return;
    if (this.currentStep !== 2) return;

    const recommendedCitiesWithReason = this.getRecommendedCitiesWithReason();
    const cityLabels = this.formContainer.querySelectorAll<HTMLElement>(
      '[data-msf-category="cities"][data-msf-option]'
    );

    cityLabels.forEach(labelEl => {
      const option = labelEl.getAttribute('data-msf-option') || '';
      const reason = recommendedCitiesWithReason.get(option);
      const badgeEl = labelEl.querySelector<HTMLElement>('[data-msf-badge="recommended"]');

      if (reason) {
        labelEl.classList.add('recommended');
        if (badgeEl) {
          badgeEl.textContent = `Recommended since you picked ${reason}`;
          badgeEl.style.display = 'inline-block';
        }
      } else {
        labelEl.classList.remove('recommended');
        if (badgeEl) {
          badgeEl.textContent = '';
          badgeEl.style.display = 'none';
        }
      }
    });
  }

  // Experience recommendations based on destinations
  private experienceRecommendations: { [key: string]: string[] } = {
    'Triglav National Park': ['Hiking', 'Panoramic Viewpoints', 'Alpine Huts'],
    'Piran': ['Swimming', 'Boat Trips', 'Sunsets'],
    'Postojna Cave': ['Cave Exploration', 'Underground Tours'],
    'Lake Bled': ['Boat Rides', 'Castle Visits', 'Hiking'],
    'Soča River': ['Rafting', 'Kayaking', 'Swimming'],
    'Ljubljana': ['City Tours', 'Castle Visits', 'Culinary Tours'],
    'Bled': ['Boat Rides', 'Castle Visits', 'Hiking'],
    'Maribor': ['Wine Tasting', 'City Tours'],
    'Predjama Castle': ['Castle Tours', 'History Tours'],
    'Bled Castle': ['Castle Tours', 'History Tours'],
    'Ljubljana Castle': ['Castle Tours', 'History Tours'],
    'Škocjan Caves': ['Cave Exploration', 'Underground Tours'],
    'Logar Valley': ['Hiking', 'Panoramic Viewpoints', 'Nature Photography'],
    'Velika Planina': ['Hiking', 'Alpine Huts', 'Traditional Culture'],
    'Vintgar Gorge': ['Hiking', 'Nature Photography', 'Waterfalls']
  };

  // Experience categories
  private experienceCategories = {
    outdoorActivities: ['Hiking', 'Cycling', 'Rafting', 'Kayaking', 'Swimming', 'Rock Climbing'],
    culinaryExperiences: ['Wine Tasting', 'Culinary Tours', 'Local Food Markets', 'Cooking Classes'],
    sportsActivities: ['Rafting', 'Kayaking', 'Cycling', 'Rock Climbing', 'Paragliding'],
    cultureHistory: ['Castle Tours', 'History Tours', 'City Tours', 'Museum Visits'],
    wellnessSlowTravel: ['Spa Treatments', 'Yoga Sessions', 'Meditation', 'Slow Walks'],
    specialExperiences: ['Sunsets', 'Panoramic Viewpoints', 'Alpine Huts', 'Boat Trips', 'Cave Exploration', 'Underground Tours', 'Nature Photography']
  };

  constructor(containerId: string, triggerButtonId: string) {
    this.formContainer = document.getElementById(containerId);
    this.triggerButton = document.getElementById(triggerButtonId);
    
    if (this.triggerButton) {
      this.triggerButton.addEventListener('click', () => this.init());
    }
  }

  private init(): void {
    if (!this.formContainer) return;
    
    // Hide trigger button
    if (this.triggerButton) {
      this.triggerButton.style.display = 'none';
    }
    
    // Show form container
    this.formContainer.style.display = 'block';
    
    // Start with step 0
    this.currentStep = 0;
    this.render();
  }

  private render(): void {
    if (!this.formContainer) return;

    switch (this.currentStep) {
      case 0:
        this.renderStep0();
        break;
      case 1:
        this.renderStep1();
        break;
      case 2:
        this.renderStep2();
        break;
      case 3:
        this.renderStep3();
        break;
    }
  }

  private renderStep0(): void {
    if (!this.formContainer) return;

    this.formContainer.innerHTML = `
      <div class="form-step">
        <div class="form-content">
          <h3 class="form-title">Lets design your perfect trip. Answer a few questions and we'll create a personalized travel proposal just for you.</h3>
          <div style="display: flex; justify-content: center; margin-top: 2rem;">
          <button class="form-button form-button-primary" onclick="window.multiStepForm.nextStep()">
            Lets begin 
          </button>
        </div>
      </div>
    `;
  }

  private renderStep1(): void {
    if (!this.formContainer) return;

    const countries = [
      'Slovenia', 'Croatia', 'Italy', 'Austria', 'Germany', 'France', 
      'United Kingdom', 'United States', 'Canada', 'Australia', 'Other'
    ];

    const countryOptions = countries.map(country => 
      `<option value="${country}">${country}</option>`
    ).join('');

    this.formContainer.innerHTML = `
      <div class="form-step">
        <div class="form-content">
          <h2 class="form-title">Let's start with you</h2>
          
          <div class="form-field">
            <label for="fullName" class="form-label">
              Full name <span class="required">*</span>
            </label>
            <input 
              type="text" 
              id="fullName" 
              class="form-input" 
              required
              value="${this.formData.basicInfo.fullName || ''}"
            />
          </div>

          <div class="form-field">
            <label for="country" class="form-label">
              Country of residence <span class="required">*</span>
            </label>
            <select id="country" class="form-select" required>
              <option value="">Select a country</option>
              ${countryOptions}
            </select>
          </div>

          <div class="form-field">
            <label for="travelDates" class="form-label">
              Preferred travel dates
            </label>
            <input 
              type="text" 
              id="travelDates" 
              class="form-input" 
              placeholder="e.g., June 2024"
              value="${this.formData.basicInfo.travelDates || ''}"
            />
          </div>

          <div class="form-actions">
            <button class="form-button form-button-secondary" onclick="window.multiStepForm.previousStep()">
              Back
            </button>
            <button class="form-button form-button-primary" onclick="window.multiStepForm.nextStep()">
              Continue
            </button>
          </div>
        </div>
      </div>
    `;

    // Set values if they exist
    if (this.formData.basicInfo.country) {
      const countrySelect = document.getElementById('country') as HTMLSelectElement;
      if (countrySelect) countrySelect.value = this.formData.basicInfo.country;
    }
  }

  private renderStep2(): void {
    if (!this.formContainer) return;

    const categories = [
      { key: 'regions', label: 'Regions', options: this.destinationCategories.regions },
      { key: 'naturalWonders', label: 'Natural Wonders', options: this.destinationCategories.naturalWonders },
      { key: 'cities', label: 'Cities', options: this.destinationCategories.cities },
      { key: 'castles', label: 'Castles & Historic Sites', options: this.destinationCategories.castles },
      { key: 'nationalParks', label: 'National Parks', options: this.destinationCategories.nationalParks },
      { key: 'unescoSites', label: 'UNESCO Sites', options: this.destinationCategories.unescoSites }
    ];

    const escapeAttr = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const categoriesHTML = categories.map(category => {
      const hasSkip = this.CATEGORIES_WITH_SKIP.includes(category.key);
      const skipChecked = !!this.formData.categorySkip[category.key];
      const optionsHTML = category.options.map(option => {
        const isChecked = this.formData.destinations.includes(option) ? 'checked' : '';
        const recBadge = category.key === 'cities' ? '<span class="recommended-badge" data-msf-badge="recommended" style="display: none;"></span>' : '';
        const optAttr = option.replace(/"/g, '&quot;');
        return `
          <label class="checkbox-label" data-msf-category="${category.key}" data-msf-option="${optAttr}">
            <input 
              type="checkbox" 
              class="form-checkbox" 
              value="${optAttr}" 
              data-category="${category.key}"
              ${isChecked}
              onchange="window.multiStepForm.toggleDestination('${category.key}', '${escapeAttr(option)}')"
            />
            <span>
              ${option}
              ${recBadge}
            </span>
          </label>
        `;
      }).join('');

      if (hasSkip) {
        const catBlock = `
        <div class="destination-category" data-msf-category-block="${category.key}">
          <h3 class="category-title">${category.label}</h3>
          <div class="checkbox-group msf-category-with-skip">
            <label class="checkbox-label msf-category-skip-row">
              <input type="checkbox" class="form-checkbox" data-msf-category-skip data-msf-category="${category.key}" ${skipChecked ? 'checked' : ''} onchange="window.multiStepForm.toggleCategorySkip('${category.key}', this.checked)" />
              <span>${this.REGION_NO_SPECIFIC}</span>
            </label>
            <div class="msf-category-options-list" data-msf-category="${category.key}" style="${skipChecked ? 'display:none' : ''}">
              ${optionsHTML}
            </div>
          </div>
        </div>
      `;
        return catBlock;
      }

      const catBlock = `
        <div class="destination-category">
          <h3 class="category-title">${category.label}</h3>
          <div class="checkbox-group">
            ${optionsHTML}
          </div>
        </div>
      `;
      if (category.key === 'regions') {
        return catBlock + `<div id="msf-region-details-container" class="region-details-container"></div>`;
      }
      return catBlock;
    }).join('');

    this.formContainer.innerHTML = `
      <div class="form-step">
        <div class="form-content">
          <h2 class="form-title">Where would you like to go?</h2>
          <p class="form-subtitle">You can choose multiple options.</p>
          
          <div class="destinations-container">
            ${categoriesHTML}
          </div>

          <div class="form-actions">
            <button class="form-button form-button-secondary" onclick="window.multiStepForm.previousStep()">
              Back
            </button>
            <button class="form-button form-button-primary" onclick="window.multiStepForm.nextStep()">
              Continue
            </button>
          </div>
        </div>
      </div>
    `;

    // Apply recommendation badges/highlights and region sub-destinations without re-rendering later
    this.updateStep2CityRecommendationsUI();
    this.updateRegionDetailsSections();
  }

  private renderStep3(): void {
    if (!this.formContainer) return;

    // Get recommended experiences based on selected destinations
    const recommendedExperiences: string[] = [];
    this.formData.destinations.forEach((dest: string) => {
      const recommendations = this.experienceRecommendations[dest] || [];
      recommendations.forEach(exp => {
        if (!recommendedExperiences.includes(exp)) {
          recommendedExperiences.push(exp);
        }
      });
    });

    // Flatten all experiences from categories
    const allExperiences: { [key: string]: string[] } = {
      'Outdoor Activities': this.experienceCategories.outdoorActivities,
      'Culinary Experiences': this.experienceCategories.culinaryExperiences,
      'Sports Activities': this.experienceCategories.sportsActivities,
      'Culture & History': this.experienceCategories.cultureHistory,
      'Wellness & Slow Travel': this.experienceCategories.wellnessSlowTravel,
      'Special Experiences': this.experienceCategories.specialExperiences
    };

    const categoriesHTML = Object.entries(allExperiences).map(([categoryName, experiences]) => {
      const experiencesHTML = experiences.map(exp => {
        const isChecked = this.formData.experiences.includes(exp) ? 'checked' : '';
        const isRecommended = recommendedExperiences.includes(exp) ? 'recommended' : '';
        
        return `
          <label class="checkbox-label ${isRecommended}">
            <input 
              type="checkbox" 
              class="form-checkbox" 
              value="${exp}" 
              ${isChecked}
              onchange="window.multiStepForm.toggleExperience('${exp}')"
            />
            <span>
              ${exp}
              ${isRecommended ? '<span class="recommended-badge">Recommended for you</span>' : ''}
            </span>
          </label>
        `;
      }).join('');

      return `
        <div class="experience-category">
          <h3 class="category-title">${categoryName}</h3>
          <div class="checkbox-group">
            ${experiencesHTML}
          </div>
        </div>
      `;
    }).join('');

    this.formContainer.innerHTML = `
      <div class="form-step">
        <div class="form-content">
          <h2 class="form-title">What do you want to experience?</h2>
          
          ${recommendedExperiences.length > 0 ? `
            <div class="recommendations-notice">
              <p>Based on your destination selections, we've highlighted some recommended experiences for you!</p>
            </div>
          ` : ''}
          
          <div class="experiences-container">
            ${categoriesHTML}
          </div>

          <div class="form-actions">
            <button class="form-button form-button-secondary" onclick="window.multiStepForm.previousStep()">
              Back
            </button>
            <button class="form-button form-button-primary" onclick="window.multiStepForm.nextStep()">
              Continue
            </button>
          </div>
        </div>
      </div>
    `;
  }

  public toggleCategorySkip(categoryKey: string, checked: boolean): void {
    this.formData.categorySkip[categoryKey] = checked;
    const options = this.destinationCategories[categoryKey as keyof typeof this.destinationCategories];
    if (!Array.isArray(options)) return;
    if (checked) {
      this.formData.destinations = this.formData.destinations.filter((d: string) => !options.includes(d));
      const block = Array.from(this.formContainer?.querySelectorAll<HTMLElement>('[data-msf-category-block]') || []).find(
        (el) => el.getAttribute('data-msf-category-block') === categoryKey
      );
      const list = block?.querySelector<HTMLElement>('.msf-category-options-list');
      if (list) list.style.display = 'none';
      block?.querySelectorAll<HTMLInputElement>('.msf-category-options-list input[data-category]').forEach((cb) => (cb.checked = false));
    } else {
      const block = Array.from(this.formContainer?.querySelectorAll<HTMLElement>('[data-msf-category-block]') || []).find(
        (el) => el.getAttribute('data-msf-category-block') === categoryKey
      );
      const list = block?.querySelector<HTMLElement>('.msf-category-options-list');
      if (list) list.style.display = '';
    }
  }

  public toggleDestination(categoryKey: string, destination: string): void {
    const index = this.formData.destinations.indexOf(destination);
    const isCurrentlySelected = index > -1;

    // Toggle the clicked destination itself
    if (isCurrentlySelected) {
      this.formData.destinations.splice(index, 1);
    } else {
      this.formData.destinations.push(destination);
    }

    // If this category has skip option, uncheck skip and show list when user picks a specific option
    if (this.CATEGORIES_WITH_SKIP.includes(categoryKey)) {
      this.formData.categorySkip[categoryKey] = false;
      const block = Array.from(this.formContainer?.querySelectorAll<HTMLElement>('[data-msf-category-block]') || []).find(
        (el) => el.getAttribute('data-msf-category-block') === categoryKey
      );
      const skipInput = block?.querySelector<HTMLInputElement>('input[data-msf-category-skip]');
      if (skipInput) skipInput.checked = false;
      const list = block?.querySelector<HTMLElement>('.msf-category-options-list');
      if (list) list.style.display = '';
    }

    // Update Step 2 recommendation badges and region sub-destinations in-place (no flicker)
    this.updateStep2CityRecommendationsUI();
    this.updateRegionDetailsSections();
  }

  public toggleExperience(experience: string): void {
    const index = this.formData.experiences.indexOf(experience);
    if (index > -1) {
      this.formData.experiences.splice(index, 1);
    } else {
      this.formData.experiences.push(experience);
    }
  }

  public nextStep(): void {
    // Validate current step before proceeding
    if (!this.validateCurrentStep()) {
      return;
    }

    // Save current step data
    this.saveCurrentStepData();

    if (this.currentStep < 3) {
      this.currentStep++;
      this.render();
    } else {
      this.handleFormSubmit();
    }
  }

  public previousStep(): void {
    // Save current step data before going back
    this.saveCurrentStepData();

    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
    }
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        const fullName = (document.getElementById('fullName') as HTMLInputElement)?.value.trim();
        const country = (document.getElementById('country') as HTMLSelectElement)?.value;
        
        if (!fullName) {
          alert('Please enter your full name.');
          return false;
        }
        if (!country) {
          alert('Please select your country of residence.');
          return false;
        }
        return true;
      
      case 2:
        if (this.formData.destinations.length === 0) {
          alert('Please select at least one destination.');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  }

  private saveCurrentStepData(): void {
    switch (this.currentStep) {
      case 1:
        this.formData.basicInfo = {
          fullName: (document.getElementById('fullName') as HTMLInputElement)?.value.trim() || '',
          country: (document.getElementById('country') as HTMLSelectElement)?.value || '',
          travelDates: (document.getElementById('travelDates') as HTMLInputElement)?.value.trim() || ''
        };
        break;
      // Step 2 and 3 data is saved via toggle methods
    }
  }

  private handleFormSubmit(): void {
    // Save final step data
    this.saveCurrentStepData();
    
    console.log('Form submitted with data:', this.formData);
    alert('Form submitted! Check console for data.\n\n' + JSON.stringify(this.formData, null, 2));
    
    // Here you would typically send data to your backend
    // Example: fetch('/api/submit-form', { method: 'POST', body: JSON.stringify(this.formData) })
  }

  // Public method to get form data (useful for Webflow integration)
  public getFormData(): any {
    return this.formData;
  }
}

// Initialize form when DOM is ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Make form instance globally available for onclick handlers
    (window as any).multiStepForm = new MultiStepForm('multi-step-form', 'form-trigger-btn');
  });
}

// Export for module systems (if needed)
export default MultiStepForm;
