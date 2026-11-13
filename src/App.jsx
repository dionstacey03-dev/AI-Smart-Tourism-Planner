import { useMemo, useState } from 'react'
import './App.css'

const destinations = [
  {
    name: 'Sigiriya',
    type: 'Culture & Heritage',
    description: 'Ancient history, iconic landscapes and Sri Lankan heritage.',
    icon: '🏛️',
  },
  {
    name: 'Kandy',
    type: 'Culture & Hills',
    description: 'Sacred landmarks, culture and beautiful hill-country scenery.',
    icon: '🌿',
  },
  {
    name: 'Ella',
    type: 'Nature & Adventure',
    description: 'Mountain views, hiking trails, waterfalls and scenic rail journeys.',
    icon: '⛰️',
  },
  {
    name: 'Yala',
    type: 'Wildlife',
    description: 'Safari experiences and some of Sri Lanka’s best-known wildlife.',
    icon: '🐘',
  },
  {
    name: 'Galle',
    type: 'History & Coast',
    description: 'Historic streets, coastal scenery and relaxed southern atmosphere.',
    icon: '🌊',
  },
  {
    name: 'Mirissa',
    type: 'Beach & Relaxation',
    description: 'Tropical beaches, ocean views and a relaxed coastal experience.',
    icon: '🏝️',
  },
]

const routeLibrary = {
  'Nature & Adventure': [
    ['Kandy', 'Explore the hill capital and prepare for the scenic journey ahead.'],
    ['Nuwara Eliya', 'Discover tea country, cool mountain weather and viewpoints.'],
    ['Ella', 'Enjoy hiking trails, waterfalls and dramatic mountain scenery.'],
    ['Yala', 'Experience a wildlife-focused day surrounded by nature.'],
    ['Mirissa', 'Slow down on the south coast after your inland adventure.'],
    ['Galle', 'Explore the historic fort and finish with coastal views.'],
    ['Colombo', 'Complete the journey with food, shopping and city experiences.'],
  ],
  'Culture & Heritage': [
    ['Colombo', 'Begin with museums, local food and an introduction to Sri Lanka.'],
    ['Sigiriya', 'Explore the Cultural Triangle and the iconic rock fortress area.'],
    ['Dambulla', 'Discover historic cave temples and cultural landmarks.'],
    ['Kandy', 'Experience heritage, traditional culture and the hill capital.'],
    ['Nuwara Eliya', 'Travel through tea country and colonial-era landscapes.'],
    ['Galle', 'Walk through the historic fort and coastal streets.'],
    ['Colombo', 'Return to the capital for the final day of the journey.'],
  ],
  'Beaches & Relaxation': [
    ['Colombo', 'Arrive, settle in and enjoy a relaxed introduction to the island.'],
    ['Bentota', 'Enjoy beaches, water activities and a slower travel pace.'],
    ['Galle', 'Explore the fort before continuing along the southern coast.'],
    ['Mirissa', 'Relax by the ocean and enjoy the tropical coastline.'],
    ['Weligama', 'Spend time on the beach and explore the local coastal area.'],
    ['Unawatuna', 'Enjoy another relaxed beach day near Galle.'],
    ['Colombo', 'Return to Colombo and complete the trip at an easy pace.'],
  ],
  Wildlife: [
    ['Colombo', 'Start the journey and prepare for Sri Lanka’s nature regions.'],
    ['Sigiriya', 'Combine cultural landscapes with nearby natural surroundings.'],
    ['Kandy', 'Explore the central hills and botanical surroundings.'],
    ['Yala', 'Enjoy a safari-focused wildlife experience.'],
    ['Udawalawe', 'Explore another major wildlife region and open landscapes.'],
    ['Mirissa', 'Finish with coastal nature and relaxation.'],
    ['Galle', 'Complete the journey with heritage and coastal scenery.'],
  ],
  'Food & Local Experiences': [
    ['Colombo', 'Explore markets, restaurants and Sri Lankan urban food culture.'],
    ['Kandy', 'Experience traditional cuisine and central Sri Lankan culture.'],
    ['Nuwara Eliya', 'Discover tea estates and cool-climate food experiences.'],
    ['Ella', 'Enjoy cafés, local dishes and mountain scenery.'],
    ['Galle', 'Explore southern cuisine within the historic fort area.'],
    ['Mirissa', 'Experience coastal food and a relaxed beach atmosphere.'],
    ['Colombo', 'Finish with another taste of the capital before departure.'],
  ],
}

const formatLKR = (value) => new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
}).format(value)

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  const [formData, setFormData] = useState({
    startLocation: 'Colombo',
    days: '7',
    travelers: '2',
    budget: 'Medium',
    interests: 'Nature & Adventure',
    travelStyle: 'Balanced',
  })

  const [plan, setPlan] = useState(null)
  const [generating, setGenerating] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const generatePlan = (event) => {
    event.preventDefault()

    const days = Math.max(1, Math.min(Number(formData.days) || 1, 14))
    const travelers = Math.max(
      1,
      Math.min(Number(formData.travelers) || 1, 10),
    )

    setGenerating(true)
    setPlan(null)

    window.setTimeout(() => {
      const selectedRoute =
        routeLibrary[formData.interests] || routeLibrary['Nature & Adventure']

      const itinerary = Array.from({ length: days }, (_, index) => {
        const destination = selectedRoute[index % selectedRoute.length]

        return {
          day: index + 1,
          place: index === 0 ? formData.startLocation : destination[0],
          description:
            index === 0
              ? `Begin your Sri Lankan journey in ${formData.startLocation}, settle in and prepare for the adventure ahead.`
              : destination[1],
        }
      })

      setPlan({
        ...formData,
        days,
        travelers,
        itinerary,
      })

      setGenerating(false)
    }, 700)
  }

  const resetPlan = () => {
    setFormData({
      startLocation: 'Colombo',
      days: '7',
      travelers: '2',
      budget: 'Medium',
      interests: 'Nature & Adventure',
      travelStyle: 'Balanced',
    })

    setPlan(null)
    setGenerating(false)
  }

  const budgetEstimate = useMemo(() => {
    if (!plan) return null

    const rates = {
      Budget: {
        accommodation: 6000,
        transport: 3500,
        food: 2500,
        activities: 1500,
      },
      Medium: {
        accommodation: 15000,
        transport: 7000,
        food: 5000,
        activities: 3500,
      },
      Premium: {
        accommodation: 35000,
        transport: 15000,
        food: 10000,
        activities: 8000,
      },
    }

    const selected = rates[plan.budget] || rates.Medium

    return {
      accommodation: selected.accommodation * plan.days,
      transport: selected.transport * plan.days,
      food: selected.food * plan.days * plan.travelers,
      activities: selected.activities * plan.days * plan.travelers,
    }
  }, [plan])

  const estimatedTotal = budgetEstimate
    ? Object.values(budgetEstimate).reduce((total, value) => total + value, 0)
    : 0

  return (
    <div className="app">
      {/* ================= NAVIGATION ================= */}
      <header className="navbar">
        <a href="#home" className="brand" onClick={closeMenu}>
          Ceylon<span>AI</span>
        </a>

        <button
          className={`menuButton ${menuOpen ? 'menuActive' : ''}`}
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={menuOpen ? 'navOpen' : ''}>
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#destinations" onClick={closeMenu}>Destinations</a>
          <a href="#planner" onClick={closeMenu}>Planner</a>
          <a href="#features" onClick={closeMenu}>Features</a>

          <a
            href="#planner"
            className="navButton"
            onClick={closeMenu}
          >
            Plan a Trip
          </a>
        </nav>
      </header>

      <main>
        {/* ================= HERO ================= */}
        <section className="hero" id="home">
          <div className="heroContent">
            <div className="prototypeBadge">
              <span></span>
              Portfolio Prototype
            </div>

            <p className="eyebrow">AI-POWERED SRI LANKA TRAVEL PLANNING</p>

            <h1>
              Discover Sri Lanka,
              <span> intelligently.</span>
            </h1>

            <p className="heroText">
              Build a personalized Sri Lankan journey around your time,
              interests, travel style and budget with a smarter planning
              experience.
            </p>

            <div className="heroActions">
              <a href="#planner" className="primaryButton">
                Start Planning
                <span>→</span>
              </a>

              <a href="#destinations" className="secondaryButton">
                Explore Destinations
              </a>
            </div>

            <div className="heroStats">
              <div>
                <strong>6+</strong>
                <span>Featured destinations</span>
              </div>

              <div>
                <strong>14</strong>
                <span>Days supported</span>
              </div>

              <div>
                <strong>100%</strong>
                <span>Customizable journey</span>
              </div>
            </div>
          </div>

          <div className="heroVisual">
            <div className="visualGlow"></div>

            <div className="routeCard">
              <div className="routeCardHeader">
                <div>
                  <p>SMART JOURNEY</p>
                  <h3>Sri Lanka Explorer</h3>
                </div>

                <span className="liveBadge">PROTOTYPE</span>
              </div>

              <div className="routeMeta">
                <span>7 Days</span>
                <span>4 Regions</span>
                <span>Balanced</span>
              </div>

              <div className="routeTimeline">
                {[
                  ['01', 'Colombo', 'Arrival & city experience'],
                  ['02', 'Kandy', 'Culture & hill country'],
                  ['03', 'Ella', 'Nature & adventure'],
                  ['04', 'South Coast', 'Ocean & relaxation'],
                ].map((item, index) => (
                  <div className="routeStep" key={item[0]}>
                    <div className="routeMarker">
                      <span>{item[0]}</span>
                      {index !== 3 && <div className="routeConnector"></div>}
                    </div>

                    <div>
                      <strong>{item[1]}</strong>
                      <p>{item[2]}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="routeFooter">
                <span>✦ Smart route generated</span>
                <span>CEYLONAI</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= DESTINATIONS ================= */}
        <section className="destinations" id="destinations">
          <div className="sectionHeading">
            <div>
              <p>EXPLORE THE ISLAND</p>
              <h2>Popular Experiences</h2>
            </div>

            <span>
              From ancient landmarks to mountain landscapes, wildlife and
              tropical coastlines.
            </span>
          </div>

          <div className="destinationGrid">
            {destinations.map((destination, index) => (
              <article className="destinationCard" key={destination.name}>
                <div className="destinationTop">
                  <span className="destinationIcon">{destination.icon}</span>
                  <span className="destinationNumber">
                    0{index + 1}
                  </span>
                </div>

                <div>
                  <p>{destination.type}</p>
                  <h3>{destination.name}</h3>
                  <span>{destination.description}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ================= PLANNER ================= */}
        <section className="plannerSection" id="planner">
          <div className="sectionHeading">
            <div>
              <p>BUILD YOUR JOURNEY</p>
              <h2>Smart Trip Planner</h2>
            </div>

            <span>
              Create a prototype itinerary based on the way you want to
              experience Sri Lanka.
            </span>
          </div>

          <div className="plannerLayout">
            <form className="plannerForm" onSubmit={generatePlan}>
              <div className="formHeader">
                <div>
                  <span>STEP 01</span>
                  <h3>Tell us about your trip</h3>
                </div>

                <button
                  type="button"
                  className="resetButton"
                  onClick={resetPlan}
                >
                  Reset
                </button>
              </div>

              <div className="formGroup">
                <label htmlFor="startLocation">Starting Location</label>

                <select
                  id="startLocation"
                  name="startLocation"
                  value={formData.startLocation}
                  onChange={handleChange}
                >
                  <option>Colombo</option>
                  <option>Negombo</option>
                  <option>Kandy</option>
                  <option>Galle</option>
                </select>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label htmlFor="days">Trip Length</label>

                  <div className="inputWithSuffix">
                    <input
                      id="days"
                      name="days"
                      type="number"
                      min="1"
                      max="14"
                      value={formData.days}
                      onChange={handleChange}
                    />
                    <span>days</span>
                  </div>
                </div>

                <div className="formGroup">
                  <label htmlFor="travelers">Travelers</label>

                  <div className="inputWithSuffix">
                    <input
                      id="travelers"
                      name="travelers"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.travelers}
                      onChange={handleChange}
                    />
                    <span>people</span>
                  </div>
                </div>
              </div>

              <div className="formGroup">
                <label htmlFor="budget">Budget Level</label>

                <select
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                >
                  <option>Budget</option>
                  <option>Medium</option>
                  <option>Premium</option>
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="interests">Main Interest</label>

                <select
                  id="interests"
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                >
                  <option>Nature & Adventure</option>
                  <option>Culture & Heritage</option>
                  <option>Beaches & Relaxation</option>
                  <option>Wildlife</option>
                  <option>Food & Local Experiences</option>
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="travelStyle">Travel Pace</label>

                <select
                  id="travelStyle"
                  name="travelStyle"
                  value={formData.travelStyle}
                  onChange={handleChange}
                >
                  <option>Relaxed</option>
                  <option>Balanced</option>
                  <option>Fast Paced</option>
                </select>
              </div>

              <button
                type="submit"
                className="generateButton"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner"></span>
                    Building Journey...
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    Generate My Journey
                  </>
                )}
              </button>

              <p className="prototypeNote">
                Prototype planner — itinerary, weather and cost information
                are demonstration estimates rather than live travel data.
              </p>
            </form>

            <div className="resultPanel">
              {generating && (
                <div className="generatingState">
                  <div className="aiOrb">✦</div>
                  <h3>Designing your journey</h3>
                  <p>
                    Matching destinations with your travel preferences...
                  </p>

                  <div className="loadingLine">
                    <span></span>
                  </div>
                </div>
              )}

              {!generating && !plan && (
                <div className="emptyResult">
                  <div className="emptyVisual">
                    <span>✦</span>
                  </div>

                  <p>YOUR JOURNEY</p>
                  <h3>Ready when you are.</h3>

                  <span>
                    Complete the planner to generate a personalized Sri Lankan
                    travel itinerary.
                  </span>

                  <div className="emptyFeatures">
                    <div>✓ Day-by-day route</div>
                    <div>✓ Budget estimate</div>
                    <div>✓ Travel considerations</div>
                  </div>
                </div>
              )}

              {!generating && plan && (
                <div className="generatedPlan">
                  <div className="planHeader">
                    <div>
                      <p>YOUR PERSONALIZED JOURNEY</p>
                      <h3>{plan.days}-Day Sri Lanka Adventure</h3>
                    </div>

                    <span>PROTOTYPE PLAN</span>
                  </div>

                  <div className="planStats">
                    <div>
                      <span>Travelers</span>
                      <strong>{plan.travelers}</strong>
                    </div>

                    <div>
                      <span>Budget</span>
                      <strong>{plan.budget}</strong>
                    </div>

                    <div>
                      <span>Style</span>
                      <strong>{plan.travelStyle}</strong>
                    </div>
                  </div>

                  <div className="planSectionTitle">
                    <span>ITINERARY</span>
                    <span>{plan.days} DAYS</span>
                  </div>

                  <div className="itinerary">
                    {plan.itinerary.map((item) => (
                      <article className="itineraryItem" key={item.day}>
                        <div className="dayColumn">
                          <span>DAY</span>
                          <strong>
                            {String(item.day).padStart(2, '0')}
                          </strong>
                        </div>

                        <div className="itineraryContent">
                          <h4>{item.place}</h4>
                          <p>{item.description}</p>

                          <div>
                            <span>Suggested stop</span>
                            <span>Flexible schedule</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="travelStatusGrid">
                    <article>
                      <span className="statusIcon">☀</span>
                      <div>
                        <p>Weather</p>
                        <strong>Demo status</strong>
                        <span>Check live conditions before travel.</span>
                      </div>
                    </article>

                    <article>
                      <span className="statusIcon">↗</span>
                      <div>
                        <p>Road Conditions</p>
                        <strong>Demo status</strong>
                        <span>Live traffic is not connected yet.</span>
                      </div>
                    </article>
                  </div>

                  <div className="budgetSection">
                    <div className="budgetHeader">
                      <div>
                        <p>ESTIMATED TRIP BUDGET</p>
                        <h4>
                          {formatLKR(estimatedTotal)}
                          <span> approx.</span>
                        </h4>
                      </div>

                      <span>{plan.budget} plan</span>
                    </div>

                    <div className="budgetGrid">
                      <div>
                        <span>Accommodation</span>
                        <strong>{formatLKR(budgetEstimate.accommodation)}</strong>
                      </div>

                      <div>
                        <span>Transport</span>
                        <strong>{formatLKR(budgetEstimate.transport)}</strong>
                      </div>

                      <div>
                        <span>Food</span>
                        <strong>{formatLKR(budgetEstimate.food)}</strong>
                      </div>

                      <div>
                        <span>Activities</span>
                        <strong>{formatLKR(budgetEstimate.activities)}</strong>
                      </div>
                    </div>

                    <p className="budgetDisclaimer">
                      Indicative LKR estimates for planning only. Actual prices vary by date,
                      provider, season and traveler choices.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="features" id="features">
          <div className="sectionHeading">
            <div>
              <p>WHY CEYLONAI?</p>
              <h2>Smarter trip planning</h2>
            </div>

            <span>
              A portfolio concept exploring how intelligent software can make
              travel planning more personalized and easier to understand.
            </span>
          </div>

          <div className="featureGrid">
            <article className="featureCard">
              <span>01</span>
              <div className="featureIcon">✦</div>
              <h3>Personalized Planning</h3>
              <p>
                Generate itineraries based on duration, interests, budget,
                travelers and preferred pace.
              </p>
            </article>

            <article className="featureCard">
              <span>02</span>
              <div className="featureIcon">⌁</div>
              <h3>Smart Routes</h3>
              <p>
                Organize destinations into an easy-to-follow day-by-day
                journey across Sri Lanka.
              </p>
            </article>

            <article className="featureCard">
              <span>03</span>
              <div className="featureIcon">◫</div>
              <h3>Budget Awareness</h3>
              <p>
                View simple demonstration estimates for accommodation,
                transport, meals and activities.
              </p>
            </article>

            <article className="featureCard">
              <span>04</span>
              <div className="featureIcon">☀</div>
              <h3>Live-Data Ready</h3>
              <p>
                Designed so future versions can integrate weather, traffic,
                maps and live travel services.
              </p>
            </article>
          </div>
        </section>

        {/* ================= FUTURE VISION ================= */}
        <section className="futureSection">
          <div>
            <p>THE NEXT VERSION</p>

            <h2>
              Built as a prototype.
              <span> Designed to grow.</span>
            </h2>

            <p className="futureText">
              Future development can connect real AI models, live weather,
              mapping, road conditions and travel-service APIs to turn the
              concept into a more intelligent planning platform.
            </p>
          </div>

          <div className="futureTags">
            <span>AI Integration</span>
            <span>Live Weather</span>
            <span>Maps & Routes</span>
            <span>Road Conditions</span>
            <span>Recommendations</span>
            <span>Trip Saving</span>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer>
        <div className="footerBrand">
          <a href="#home" className="brand">
            Ceylon<span>AI</span>
          </a>

          <p>AI Smart Tourism Planner for Sri Lanka.</p>
        </div>

        <div className="footerCenter">
          <span>Portfolio Project</span>
          <span>•</span>
          <span>React + Vite</span>
          <span>•</span>
          <span>2026</span>
        </div>

        <a
          href="https://github.com/dionstacey03-dev"
          target="_blank"
          rel="noreferrer"
          className="footerLink"
        >
          GitHub ↗
        </a>
      </footer>
    </div>
  )
}

export default App