import axios from "axios";

const apiClient = axios.create({
    baseURL:"http://localhost:2000",
    withCredentials: true 
});

apiClient.interceptors.request.use(
    (config)=>{
        console.log(config)
        return config
    },
    (error)=>{
        console.log(error.message)
        return Promise.reject(error)
    }
    
)

apiClient.interceptors.response.use(
    (response)=>{
        console.log(response);
        return response
    },
    (error)=>{
        if(error.response?.status === 400 || error.response?.status === 404){
            console.log("Unauthorized || Forbidden");
        }
        return Promise.reject(error)
    }
)

export default apiClient;
