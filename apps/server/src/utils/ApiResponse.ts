export class ApiResponse{
    data:Object;
    statusCode:number;
    message:string;
    success:boolean;
    constructor(statusCode:number, data:Object, message:string){
        this.statusCode = statusCode;
        this.message = message;
        this.success = statusCode<400;
        this.data = data;
    }
}