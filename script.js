const nasaApiKey = 'U2HQtYyqMkkhYJ2ftCkvoQPan6uqxbV4kCcqBwx2';

// 1️⃣ Numerical: Asteroid diameters
async function fetchAsteroidData() {
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-05-01&api_key=${nasaApiKey}`);
    const data = await res.json();
    const neos = Object.values(data.near_earth_objects).flat();
    const asteroids = neos.slice(0, 10).map(neo => ({
        name: neo.name,
        diameter: neo.estimated_diameter.meters.estimated_diameter_max
    }));
    drawAsteroidBarChart(asteroids);
}

function drawAsteroidBarChart(data) {
    const svg = d3.select('#asteroid-bar-chart').append('svg');
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };

    const x = d3.scaleBand().domain(data.map(d => d.name)).range([margin.left, width - margin.right]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.diameter)]).range([height - margin.bottom, margin.top]);

    svg.append('g')
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d.name))
        .attr('y', d => y(d.diameter))
        .attr('width', x.bandwidth())
        .attr('height', d => height - margin.bottom - y(d.diameter))
        .attr('fill', 'orange');

    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));
}

// 2️⃣ Spatial: Mars Rover landing map
function drawMarsMap() {
    const svg = d3.select('#mars-map').append('svg')
        .attr('width', 800)
        .attr('height', 400);

    const width = +svg.attr('width');
    const height = +svg.attr('height');

    const marsImageURL = 'mars.jpg'; // Make sure you have this image locally

    svg.append('image')
        .attr('href', marsImageURL)
        .attr('width', width)
        .attr('height', height);

    const marsRovers = [
        { name: 'Curiosity', lat: -4.5895, lon: 137.4417 },
        { name: 'Perseverance', lat: 18.4446, lon: 77.4509 },
        { name: 'Spirit', lat: -14.5684, lon: 175.4726 },
        { name: 'Opportunity', lat: -1.9462, lon: 354.4734 }
    ];

    const projection = d3.geoEquirectangular()
        .scale(width / (2 * Math.PI))
        .translate([width / 2, height / 2]);

    svg.selectAll('circle')
        .data(marsRovers)
        .enter()
        .append('circle')
        .attr('cx', d => {
            let lon = d.lon > 180 ? d.lon - 360 : d.lon;
            return projection([lon, d.lat])[0];
        })
        .attr('cy', d => projection([d.lon > 180 ? d.lon - 360 : d.lon, d.lat])[1])
        .attr('r', 8)
        .attr('fill', 'red');

    svg.selectAll('text')
        .data(marsRovers)
        .enter()
        .append('text')
        .attr('x', d => {
            let lon = d.lon > 180 ? d.lon - 360 : d.lon;
            return projection([lon, d.lat])[0] + 10;
        })
        .attr('y', d => projection([d.lon > 180 ? d.lon - 360 : d.lon, d.lat])[1])
        .text(d => d.name)
        .attr('fill', 'white')
        .attr('font-size', '12px');
}

// 3️⃣ Textual: Rover photo word cloud
async function fetchRoverPhotos() {
    const res = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=${nasaApiKey}`);
    const data = await res.json();
    const cameras = data.photos.map(photo => photo.camera.full_name);
    const freq = {};
    cameras.forEach(cam => freq[cam] = (freq[cam] || 0) + 1);

    const words = Object.keys(freq).map(text => ({ text, size: 10 + freq[text] * 5 }));
    drawWordCloud(words);
}

function drawWordCloud(words) {
    const svg = d3.select('#rover-word-cloud').append('svg');
    const width = svg.node().getBoundingClientRect().width || 800;
    const height = svg.node().getBoundingClientRect().height || 400;

    const layout = d3.layout.cloud()
        .size([width, height])
        .words(words)
        .padding(5)
        .rotate(() => 0)
        .fontSize(d => d.size)
        .on('end', draw);

    layout.start();

    function draw(words) {
        svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`)
            .selectAll('text')
            .data(words)
            .enter()
            .append('text')
            .style('font-size', d => `${d.size}px`)
            .style('fill', 'lightblue')
            .attr('text-anchor', 'middle')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .text(d => d.text);
    }
}

// Run all
fetchAsteroidData();
drawMarsMap();
fetchRoverPhotos();
