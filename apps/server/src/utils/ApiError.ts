export class ApiError extends Error{
    data:null;
    statusCode:number;
    message:string;
    success:boolean;
    constructor(statusCode:number, message:string, stack?:string){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.data = null;
        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}