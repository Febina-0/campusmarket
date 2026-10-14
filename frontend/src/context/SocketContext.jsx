import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { io } from "socket.io-client";

import { useAuth } from "./AuthContext";


const SocketContext = createContext();

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5001";


export const SocketProvider = ({
  children
}) => {

  const [socket, setSocket] =
    useState(null);

  const {
    user,
    token,
    isAuthenticated
  } = useAuth();


  useEffect(() => {

    if (
      !isAuthenticated ||
      !user ||
      !token
    ) {

      if (socket) {

        socket.disconnect();
        setSocket(null);

      }

      return;

    }


    const newSocket = io(
      SOCKET_SERVER_URL,
      {
        withCredentials: true,

        auth: {
          token
        }
      }
    );


    newSocket.on(
      "connect",
      () => {

        console.log(
          "Connected to socket server:",
          newSocket.id
        );

        const userId =
          user.id ||
          user._id;

        if (userId) {

          newSocket.emit(
            "join",
            userId
          );

        }

      }
    );


    newSocket.on(
      "connect_error",
      (error) => {

        console.error(
          "Socket connection error:",
          error.message
        );

      }
    );


    setSocket(newSocket);


    return () => {

      newSocket.disconnect();

    };

  }, [
    isAuthenticated,
    token,
    user?.id,
    user?._id
  ]);


  return (

    <SocketContext.Provider
      value={{ socket }}
    >

      {children}

    </SocketContext.Provider>

  );

};


export const useSocket = () => {

  const context =
    useContext(SocketContext);

  if (!context) {

    throw new Error(
      "useSocket must be used within SocketProvider"
    );

  }

  return context;

};