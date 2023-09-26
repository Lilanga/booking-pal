import React, { useEffect, useState } from 'react';
import PropTypes, { func } from 'prop-types';
import classNames from 'classnames';

function Button(props) {

  const [clicked, setClicked] = useState(false);
  let clickedTimer;

  function handleClick(e) {
    setClicked(true);
    clickedTimer = setTimeout(
      () => setClicked(false),
      1000
    );

    props.handleClick(e);
  }

  useEffect(() => {
    return () => {
      clearTimeout(clickedTimer);
    }
  }, []);

  const iconClasses = classNames('icon', `icon-${props.icon}`);
  const btnClasses = classNames({
    clicked: clicked,
    disabled: props.disabled
  }, props.className);

  return (
    <button onClick={handleClick} className={btnClasses} disabled={clicked}>
      <i className={iconClasses}></i>
    </button>
  );
}

Button.propTypes = {
  icon: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

Button.defaultProps = {
  disabled: false
}

export default Button;
