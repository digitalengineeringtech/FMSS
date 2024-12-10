export const getVehicle = (id : any) => {
    const vehicles = [
        { id: 1, name: "Cycle" },
        { id: 2, name: "Cycle 3 wheels" },
        { id: 3, name: "Car" },
        { id: 4, name: "Bus (City)" },
        { id: 5, name: "Bus (High Way)" },
        { id: 6, name: "Light Truck (City)" },
        { id: 7, name: "Light Truck (High Way)" },
        { id: 8, name: "Heavy Truck (City)" },
        { id: 9, name: "Heavy Truck (High Way)" },
        { id: 10, name: "Trailer" },
        { id: 11, name: "Trailer (High Way)" },
        { id: 12, name: "Htawlargyi" },
        { id: 13, name: "Tractor" },
        { id: 14, name: "Small Tractor" },
        { id: 15, name: "Heavy Machinery" },
        { id: 16, name: "Commercial Vehicle" },
        { id: 17, name: "Phone Tower" },
        { id: 18, name: "Industrial Zone" },
        { id: 19, name: "Generator (Industry)" },
        { id: 20, name: "Agriculture Machine" },
        { id: 21, name: "Generator (Home Use)" },
        { id: 22, name: "Hospital" },
        { id: 23, name: "School" },
        { id: 24, name: "Super Market" },
        { id: 25, name: "Hotel" },
        { id: 26, name: "Housing" },
        { id: 27, name: "Boat" },
    ]
    const vehicle = vehicles.find(vehicle => vehicle.id == id);

    if (vehicle) {
        return {
            id: vehicle.id,
            name: vehicle.name
        }
    } else {
        return {
            id: 1,
            name: "Cycle"
        }
    }   
}