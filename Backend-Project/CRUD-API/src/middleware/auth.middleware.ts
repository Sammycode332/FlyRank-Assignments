import { NextFunction, Request, Response } from "express";
import supabase from "../supabase";

async function authMiddleware(req: Request, res: Response,next:NextFunction) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }
    const parts = authHeader.split(' ');
    if(parts[0]!== "Bearer" || parts[1] === undefined){
        return res.status(401).json({
            error: "Invalid authorization header"
        })
    }
    const token = parts[1]
    const {data, error} = await supabase.auth.getUser(token)

    if(error){
        return res.status(401).json({
            error: "Invalid token"
        })
    }
    next()
}
export default authMiddleware