declare module 'react-native-razorpay' {
  const RazorpayCheckout: {
    open: (options: any) => Promise<any>;
    on: (event: string, callback: any) => void;
  };
  export default RazorpayCheckout;
}
