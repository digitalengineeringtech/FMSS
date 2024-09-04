const allowedOrigins = ['http://localhost:5173'];

const corsOptions = (req: any, callback: any) => {
    let corsOptions;
  
    if (allowedOrigins.indexOf(req.header('Origin')) !== -1 || !req.header('Origin')) {
      corsOptions = {
        origin: req.header('Origin'),
        credentials: true
      };
    } else if (!req.header('Origin')) {
      corsOptions = { origin: '*' };
    } else {
      corsOptions = { origin: false }; // Disable CORS for this request
    }
  
    callback(null, corsOptions);
};

export default corsOptions;