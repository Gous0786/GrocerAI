import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, Trash2, Package, User, Phone, MapPin } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

interface UserProfile {
  full_name?: string
  phone?: string
  address?: string
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateCartQuantity, getCartTotal, placeOrder, user } = useApp()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Fetch user profile when cart opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserProfile()
    }
  }, [isOpen, user])

  const fetchUserProfile = async () => {
    if (!user) return

    setProfileLoading(true)
    try {
      const { data: authUser, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setUserProfile({
        full_name: authUser.user?.user_metadata?.full_name || '',
        phone: authUser.user?.user_metadata?.phone || '',
        address: authUser.user?.user_metadata?.address || ''
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    updateCartQuantity(productId, newQuantity)
  }

  const handleRemoveItem = (productId: string) => {
    updateCartQuantity(productId, 0)
  }

  const handlePlaceOrder = async () => {
    if (!userProfile?.phone || !userProfile?.address || isPlacingOrder) {
      return
    }

    setIsPlacingOrder(true)
    try {
      const customerName = userProfile.full_name || user?.email?.split('@')[0] || 'Customer'
      await placeOrder(userProfile.address, customerName, userProfile.phone)
      onClose()
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const isProfileComplete = userProfile?.phone && userProfile?.address && 
                           userProfile.phone.length >= 10 && userProfile.address.length >= 10

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-effect rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-white/20"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold gradient-text">Shopping Cart</h2>
                  <p className="text-sm text-gray-500">{cartItems.length} items</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 px-6 text-center"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 text-sm">Add some delicious items to get started!</p>
              </motion.div>
            ) : (
              <div className="p-4 sm:p-6 space-y-4">
                <AnimatePresence>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-effect rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={item.product?.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                            alt={item.product?.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shadow-md"
                          />
                          <div className="absolute -top-2 -right-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1 truncate">
                            {item.product?.name}
                          </h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-emerald-600 font-semibold text-sm sm:text-base">
                              ₹{item.product?.price}
                            </span>
                            <span className="text-gray-500 text-xs sm:text-sm">
                              per {item.product?.unit}
                            </span>
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                                className="w-7 h-7 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </motion.button>
                              
                              <motion.span 
                                key={item.quantity}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className="font-bold text-gray-800 min-w-[2rem] text-center text-sm sm:text-base"
                              >
                                {item.quantity}
                              </motion.span>
                              
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                                className="w-7 h-7 bg-emerald-500 text-white rounded-md flex items-center justify-center hover:bg-emerald-600 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </motion.button>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-bold text-gray-800 text-sm sm:text-base">
                                ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} × ₹{item.product?.price}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Checkout Section */}
          {cartItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-6 border-t border-white/10 flex-shrink-0 bg-white/5"
            >
              {/* Order Summary */}
              <div className="mb-6 p-4 glass-effect rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold">₹{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="text-xl font-bold gradient-text">₹{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Profile Information Display */}
              {profileLoading ? (
                <div className="mb-6 p-4 glass-effect rounded-xl">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ) : userProfile ? (
                <div className="mb-6 p-4 glass-effect rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Delivery Information
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{userProfile.full_name || user?.email?.split('@')[0] || 'Customer'}</span>
                    </div>
                    
                    {userProfile.phone ? (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{userProfile.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500">
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="italic">Phone number required</span>
                      </div>
                    )}
                    
                    {userProfile.address ? (
                      <div className="flex items-start text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-2">{userProfile.address}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="italic">Delivery address required</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Profile Completion Notice */}
              {!isProfileComplete && userProfile && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <h5 className="font-semibold text-yellow-800 mb-2">Complete Your Profile</h5>
                  <p className="text-yellow-700 text-sm mb-3">
                    Please complete your profile with phone number and delivery address to place orders.
                  </p>
                  <button
                    onClick={() => {
                      onClose()
                      // You can trigger profile modal here if needed
                    }}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-sm"
                  >
                    Complete Profile
                  </button>
                </div>
              )}

              {/* Place Order Button */}
              <motion.button
                whileHover={{ scale: isProfileComplete ? 1.02 : 1 }}
                whileTap={{ scale: isProfileComplete ? 0.98 : 1 }}
                onClick={handlePlaceOrder}
                disabled={!isProfileComplete || isPlacingOrder}
                className="w-full btn-primary py-4 text-lg font-bold disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Placing Order...</span>
                  </>
                ) : !isProfileComplete ? (
                  <>
                    <Package className="h-5 w-5" />
                    <span>Complete Profile to Order</span>
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5" />
                    <span>Place Order - ₹{getCartTotal().toFixed(2)}</span>
                  </>
                )}
              </motion.button>

              <p className="text-xs text-gray-500 text-center mt-3">
                {isProfileComplete 
                  ? "By placing this order, you agree to our terms and conditions"
                  : "Complete your profile in the user menu to place orders"
                }
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default Cart