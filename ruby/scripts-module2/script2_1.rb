class Spaceship
  def launch(destination) # method
    @destination = destination # instance variable (private by default), own copy of destination
    # go towards destination
  end

  def destination # by defining this, we complete the lesson
    @destination
  end
end

ship = Spaceship.new # creating class
ship.launch("Earth") # using method with class
#puts ship.inspect
p ship

puts ship.destination # will only execute with a method in the class